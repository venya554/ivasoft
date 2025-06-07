import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Функция для создания базового админа, если его нет
async function createAdminIfNotExists() {
  try {
    const adminUser = await storage.getUserByUsername("admin");
    
    if (!adminUser) {
      console.log("Создание пользователя с правами администратора...");
      
      const adminPassword = "Jingle2018";
      
      await storage.createUser({
        username: "admin",
        password: await hashPassword(adminPassword),
        email: "admin@ivasoft.ru",
        fullName: "Администратор системы",
        role: "admin",
        createdAt: new Date()
      });
      
      console.log("Пользователь с правами администратора успешно создан");
    }
  } catch (error) {
    console.error("Ошибка при создании администратора:", error);
  }
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    console.warn("SESSION_SECRET environment variable not set. Using default secret.");
  }
  
  // Создаем базового админа при запуске сервера
  createAdminIfNotExists();

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "ivasoft-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 дней
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Проверка существования пользователя по имени
      const existingUserByUsername = await storage.getUserByUsername(req.body.username);
      if (existingUserByUsername) {
        return res.status(400).json({ success: false, message: "Пользователь с таким именем уже существует" });
      }

      // Проверка существования пользователя по email
      const existingUserByEmail = await storage.getUserByEmail(req.body.email);
      if (existingUserByEmail) {
        return res.status(400).json({ success: false, message: "Пользователь с таким email уже существует" });
      }

      // Хеширование пароля и создание пользователя
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Удаляем пароль из ответа
      const { password, ...userWithoutPassword } = user;

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ success: true, user: userWithoutPassword });
      });
    } catch (error) {
      console.error("Ошибка при регистрации:", error);
      res.status(500).json({ success: false, message: "Ошибка при регистрации пользователя" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ success: false, message: "Неверное имя пользователя или пароль" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Обновляем пользователя при входе в систему
        // В схеме UpdateUserProfile нет поля lastLogin, поэтому не обновляем это поле
        
        // Удаляем пароль из ответа
        const { password, ...userWithoutPassword } = user;
        
        return res.status(200).json({ success: true, user: userWithoutPassword });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: "Не авторизован" });
    }
    
    // Удаляем пароль из ответа
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    
    res.json({ success: true, user: userWithoutPassword });
  });

  // Обновление профиля пользователя
  app.put("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: "Не авторизован" });
    }

    try {
      const user = await storage.updateUserProfile(req.user!.id, req.body);
      
      // Удаляем пароль из ответа
      const { password, ...userWithoutPassword } = user;
      
      res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
      console.error("Ошибка при обновлении профиля:", error);
      res.status(500).json({ success: false, message: "Ошибка при обновлении профиля" });
    }
  });
  
  // Обновление пароля пользователя
  app.put("/api/user/password", async (req, res) => {
    if (!req.isAuthenticated() && req.body.username !== 'admin') {
      return res.status(401).json({ success: false, message: "Не авторизован" });
    }
    
    try {
      // Получаем данные из запроса
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ success: false, message: "Отсутствуют обязательные поля" });
      }
      
      // Хешируем новый пароль
      const hashedPassword = await hashPassword(password);
      
      // Обновляем пароль в базе данных
      const success = await storage.updateUserPassword(username, hashedPassword);
      
      if (success) {
        return res.json({ success: true, message: "Пароль успешно обновлен" });
      } else {
        return res.status(404).json({ success: false, message: "Пользователь не найден" });
      }
    } catch (error) {
      console.error("Ошибка при обновлении пароля:", error);
      res.status(500).json({ success: false, message: "Ошибка при обновлении пароля" });
    }
  });
}

// Функция для генерации хеша пароля при создании пользователей
export { hashPassword };