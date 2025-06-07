import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import nodemailer from "nodemailer";
import { contactMessageSchema, insertProjectSchema, insertProjectTaskSchema, insertProjectCommentSchema, users, projects, contactMessages, chatMessages, type InsertChatMessage } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { eq } from "drizzle-orm";
import { db } from "./db";
import multer from "multer";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { WebSocketServer, WebSocket } from "ws";

// Настраиваем multer для загрузки файлов
const uploadDir = join(process.cwd(), "uploads");

// Создаем директорию для загрузки, если она не существует
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    // Создаем поддиректорию для каждого проекта
    const projectId = req.params.projectId;
    const projectDir = join(uploadDir, projectId);

    if (!existsSync(projectDir)) {
      mkdirSync(projectDir, { recursive: true });
    }

    cb(null, projectDir);
  },
  filename: function (req, file, cb) {
    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Получаем расширение исходного файла
    const fileExt = file.originalname.split('.').pop();
    cb(null, `${uniqueSuffix}.${fileExt}`);
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB макс. размер файла
  } 
});

// Middleware для проверки аутентификации
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, message: "Не авторизован" });
}

// Middleware для проверки прав администратора
function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ success: false, message: "Доступ запрещен. Требуются права администратора." });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Настраиваем аутентификацию
  setupAuth(app);

  // Настраиваем статическое обслуживание файлов
  app.use('/uploads', isAuthenticated, express.static(uploadDir));

  // API проектов
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const projects = await storage.getUserProjects(req.user!.id);
      res.json({ success: true, projects });
    } catch (error: any) {
      console.error("Ошибка получения проектов:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при получении проектов" 
      });
    }
  });

  // API для получения списка администраторов
  app.get("/api/admins", isAuthenticated, async (req, res) => {
    try {
      // Получаем список всех пользователей с ролью "admin"
      const users = await storage.getUsers();
      const admins = users.filter(user => user.role === "admin").map(admin => ({
        id: admin.id,
        username: admin.username,
        fullName: admin.fullName,
        avatar: admin.avatar,
        role: admin.role
      }));

      res.json({ success: true, admins });
    } catch (error: any) {
      console.error("Ошибка получения списка администраторов:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при получении списка администраторов" 
      });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ success: false, message: "Неверный ID проекта" });
      }

      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ success: false, message: "Проект не найден" });
      }

      // Проверка прав доступа к проекту
      if (project.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Нет доступа к проекту" });
      }

      // Получаем задачи, комментарии и файлы проекта
      const [tasks, comments, files] = await Promise.all([
        storage.getProjectTasks(projectId),
        storage.getProjectComments(projectId),
        storage.getProjectFiles(projectId)
      ]);

      res.json({ 
        success: true, 
        project,
        tasks,
        comments,
        files
      });
    } catch (error: any) {
      console.error("Ошибка получения проекта:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при получении данных проекта" 
      });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse({
        ...req.body,
        userId: req.user!.id
      });

      const project = await storage.createProject(projectData);
      res.status(201).json({ success: true, project });
    } catch (error: any) {
      if (error?.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          success: false, 
          message: "Ошибка валидации данных проекта",
          errors: validationError.details
        });
      } else {
        console.error("Ошибка создания проекта:", error);
        res.status(500).json({ 
          success: false, 
          message: "Ошибка при создании проекта" 
        });
      }
    }
  });

  app.put("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ success: false, message: "Неверный ID проекта" });
      }

      // Проверка существования проекта и прав доступа
      const existingProject = await storage.getProject(projectId);
      if (!existingProject) {
        return res.status(404).json({ success: false, message: "Проект не найден" });
      }

      if (existingProject.userId !== req.user!.id) {
        return res.status(403).json({ success: false, message: "Нет доступа к проекту" });
      }

      const updatedProject = await storage.updateProject(projectId, req.body);
      res.json({ success: true, project: updatedProject });
    } catch (error: any) {
      console.error("Ошибка обновления проекта:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при обновлении проекта" 
      });
    }
  });

  // API задач проекта
  app.get("/api/projects/:projectId/tasks", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ success: false, message: "Неверный ID проекта" });
      }

      // Проверка прав доступа к проекту
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "Проект не найден" });
      }

      if (project.userId !== req.user!.id) {
        return res.status(403).json({ success: false, message: "Нет доступа к проекту" });
      }

      const tasks = await storage.getProjectTasks(projectId);
      res.json({ success: true, tasks });
    } catch (error: any) {
      console.error("Ошибка получения задач:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при получении задач проекта" 
      });
    }
  });

  app.post("/api/projects/:projectId/tasks", isAuthenticated, async (req, res) => {
    try {
      console.log("=== Начало создания задачи ===");
      console.log("Тело запроса:", req.body);
      console.log("Заголовки запроса:", req.headers);
      
      const projectId = parseInt(req.params.projectId);
      console.log("ID проекта:", projectId);
      console.log("Тип deadline:", typeof req.body.deadline);
      console.log("Значение deadline:", req.body.deadline);
      
      if (isNaN(projectId)) {
        console.log("Ошибка: неверный ID проекта");
        return res.status(400).json({ success: false, message: "Неверный ID проекта" });
      }

      // Проверка прав доступа к проекту
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "Проект не найден" });
      }

      if (project.userId !== req.user!.id) {
        return res.status(403).json({ success: false, message: "Нет доступа к проекту" });
      }

      console.log("Данные для валидации:", {
        ...req.body,
        projectId
      });

      const taskData = insertProjectTaskSchema.parse({
        ...req.body,
        projectId
      });

      console.log("Данные после валидации:", taskData);

      const task = await storage.createProjectTask(taskData);
      console.log("Задача создана успешно:", task);
      res.status(201).json({ success: true, task });
    } catch (error: any) {
      if (error?.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          success: false, 
          message: "Ошибка валидации данных задачи",
          errors: validationError.details
        });
      } else {
        console.error("Ошибка создания задачи:", error);
        res.status(500).json({ 
          success: false, 
          message: "Ошибка при создании задачи" 
        });
      }
    }
  });

  app.put("/api/projects/:projectId/tasks/:taskId", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const taskId = parseInt(req.params.taskId);

      if (isNaN(projectId) || isNaN(taskId)) {
        return res.status(400).json({ success: false, message: "Неверные параметры запроса" });
      }

      // Проверка прав доступа к проекту
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "Проект не найден" });
      }

      if (project.userId !== req.user!.id) {
        return res.status(403).json({ success: false, message: "Нет доступа к проекту" });
      }

      const updatedTask = await storage.updateProjectTask(taskId, req.body);
      res.json({ success: true, task: updatedTask });
    } catch (error: any) {
      console.error("Ошибка обновления задачи:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при обновлении задачи" 
      });
    }
  });

  // API комментариев к проекту
  app.get("/api/projects/:projectId/comments", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ success: false, message: "Неверный ID проекта" });
      }

      // Проверка прав доступа к проекту
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "Проект не найден" });
      }

      if (project.userId !== req.user!.id) {
        return res.status(403).json({ success: false, message: "Нет доступа к проекту" });
      }

      const comments = await storage.getProjectComments(projectId);
      res.json({ success: true, comments });
    } catch (error: any) {
      console.error("Ошибка получения комментариев:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при получении комментариев" 
      });
    }
  });

  // API файлов проекта
  app.get("/api/projects/:projectId/files", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ success: false, message: "Неверный ID проекта" });
      }

      // Проверка прав доступа к проекту
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "Проект не найден" });
      }

      if (project.userId !== req.user!.id) {
        return res.status(403).json({ success: false, message: "Нет доступа к проекту" });
      }

      const files = await storage.getProjectFiles(projectId);
      res.json({ success: true, files });
    } catch (error: any) {
      console.error("Ошибка получения файлов:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при получении файлов проекта" 
      });
    }
  });

  app.post("/api/projects/:projectId/files", isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ success: false, message: "Неверный ID проекта" });
      }

      // Проверка загрузки файла
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Файл не был загружен" });
      }

      // Проверка прав доступа к проекту
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "Проект не найден" });
      }

      if (project.userId !== req.user!.id) {
        return res.status(403).json({ success: false, message: "Нет доступа к проекту" });
      }

      // Создаем запись о файле в БД
      const fileData = {
        projectId,
        userId: req.user!.id,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        description: req.body.description || null,
        fileType: req.body.fileType || null
      };

      const file = await storage.createProjectFile(fileData);
      res.status(201).json({ success: true, file });
    } catch (error: any) {
      console.error("Ошибка загрузки файла:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при загрузке файла" 
      });
    }
  });

  // Получение файла проекта
  app.get("/api/files/:fileId", isAuthenticated, async (req, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      if (isNaN(fileId)) {
        return res.status(400).json({ success: false, message: "Неверный ID файла" });
      }

      // Получаем данные о файле
      const file = await storage.getProjectFile(fileId);
      if (!file) {
        return res.status(404).json({ success: false, message: "Файл не найден" });
      }

      // Проверяем права доступа к файлу через проверку проекта
      const project = await storage.getProject(file.projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "Проект не найден" });
      }

      if (project.userId !== req.user!.id) {
        return res.status(403).json({ success: false, message: "Нет доступа к файлу" });
      }

      // Отправляем файл
      res.sendFile(file.path, { root: '.' });
    } catch (error: any) {
      console.error("Ошибка получения файла:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при получении файла" 
      });
    }
  });

  app.post("/api/projects/:projectId/comments", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ success: false, message: "Неверный ID проекта" });
      }

      // Проверка прав доступа к проекту
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "Проект не найден" });
      }

      if (project.userId !== req.user!.id) {
        return res.status(403).json({ success: false, message: "Нет доступа к проекту" });
      }

      const commentData = insertProjectCommentSchema.parse({
        ...req.body,
        projectId,
        userId: req.user!.id
      });

      const comment = await storage.createProjectComment(commentData);
      res.status(201).json({ success: true, comment });
    } catch (error: any) {
      if (error?.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          success: false, 
          message: "Ошибка валидации данных комментария",
          errors: validationError.details
        });
      } else {
        console.error("Ошибка создания комментария:", error);
        res.status(500).json({ 
          success: false, 
          message: "Ошибка при создании комментария" 
        });
      }
    }
  });
  // Настраиваем транспорт для отправки писем
  const emailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "user@example.com",
      pass: process.env.SMTP_PASS || "password",
    },
  });

  // Обработка контактной формы
  app.post("/api/contact", async (req, res) => {
    try {
      // Валидация входящих данных
      const validatedData = contactMessageSchema.parse(req.body);

      // Сохраняем сообщение в хранилище
      const savedMessage = await storage.createMessage(validatedData);

      // Пытаемся отправить письмо
      try {
        await emailTransport.sendMail({
          from: process.env.EMAIL_FROM || "no-reply@ivasoft.ru",
          to: process.env.EMAIL_TO || "info@ivasoft.ru",
          subject: `Новое сообщение: ${validatedData.subject}`,
          text: `
            Имя: ${validatedData.name}
            Email: ${validatedData.email}
            Тема: ${validatedData.subject}

            Сообщение:
            ${validatedData.message}
          `,
          html: `
            <strong>Имя:</strong> ${validatedData.name}<br>
            <strong>Email:</strong> ${validatedData.email}<br>
            <strong>Тема:</strong> ${validatedData.subject}<br>
            <br>
            <strong>Сообщение:</strong><br>
            ${validatedData.message.replace(/\n/g, '<br>')}
          `,
        });
      } catch (emailError) {
        console.error("Ошибка отправки email:", emailError);
        // Продолжаем выполнение, даже если письмо не отправилось
        // Сообщение уже сохранено в БД
      }

      res.status(201).json({ 
        success: true, 
        message: "Сообщение успешно отправлено",
        id: savedMessage.id
      });
    } catch (error: any) {
      if (error?.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          success: false, 
          message: "Ошибка валидации данных",
          errors: validationError.details
        });
      } else {
        console.error("Ошибка обработки контактной формы:", error);
        res.status(500).json({ 
          success: false, 
          message: "Произошла ошибка при обработке запроса"
        });
      }
    }
  });

  const httpServer = createServer(app);

  // Настраиваем WebSocket-сервер с keepAlive
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Map для хранения соединений пользователей по userId
  const userConnections = new Map<number, Set<WebSocket>>();

  // Функция для поддержания соединения активным
  function heartbeat() {
    this.isAlive = true;
  }

  wss.on('connection', (ws, req) => {
    console.log('WebSocket соединение установлено');

    // Получить пользователя из сессии
    const sessionParser = (req.rawHeaders.indexOf('Cookie') !== -1) ? 
      req.rawHeaders[req.rawHeaders.indexOf('Cookie') + 1] : '';

    // Приветственное сообщение
    ws.send(JSON.stringify({ 
      type: 'connection', 
      message: 'Соединение с сервером установлено успешно'
    }));

    // Обработка аутентификации через WebSocket
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());

        // Аутентификация клиента
        if (data.type === 'auth' && data.userId) {
          const userId = parseInt(data.userId);

          // Добавляем соединение в Map пользователя
          if (!userConnections.has(userId)) {
            userConnections.set(userId, new Set());
          }
          userConnections.get(userId)?.add(ws);

          // Отправляем все активные дедлайны пользователю
          await sendDeadlineNotifications(userId);

          console.log(`Пользователь ${userId} авторизован через WebSocket`);
        }
      } catch (error) {
        console.error('Ошибка обработки WebSocket сообщения:', error);
      }
    });

    // Обработка закрытия соединения
    ws.isAlive = true;
    ws.on('pong', heartbeat);

    ws.on('close', () => {
      // Удаляем соединение из всех пользователей
      Array.from(userConnections.entries()).forEach(([userId, connections]) => {
        if (connections.has(ws)) {
          connections.delete(ws);
          if (connections.size === 0) {
            userConnections.delete(userId);
          }
          return; // эквивалент break в forEach через ранний return
        }
      });
      console.log('WebSocket соединение закрыто');
    });
  });

  // Проверка активности соединений каждые 30 секунд
  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  // Функция для отправки уведомлений о дедлайнах пользователю
  async function sendDeadlineNotifications(userId: number) {
    try {
      // Получаем проекты пользователя
      const projects = await storage.getUserProjects(userId);

      // Для каждого проекта получаем задачи
      let deadlineItems = [];

      // Добавляем проекты с дедлайнами
      const projectDeadlines = projects
        .filter(p => p.deadline)
        .map(p => ({
          id: p.id,
          projectId: p.id,
          projectTitle: p.title,
          title: p.title,
          deadline: new Date(p.deadline!),
          type: 'project' as const,
          status: p.status
        }));

      deadlineItems.push(...projectDeadlines);

      // Получаем задачи для всех проектов
      for (const project of projects) {
        const tasks = await storage.getProjectTasks(project.id);

        // Добавляем задачи с дедлайнами
        const taskDeadlines = tasks
          .filter(t => t.deadline)
          .map(t => ({
            id: t.id,
            projectId: project.id,
            projectTitle: project.title,
            title: t.title,
            deadline: new Date(t.deadline!),
            type: 'task' as const,
            status: t.status
          }));

        deadlineItems.push(...taskDeadlines);
      }

      // Сортируем по дате дедлайна
      deadlineItems.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());

      // Фильтруем только приближающиеся дедлайны (в течение недели)
      const now = new Date();
      const weekLater = new Date();
      weekLater.setDate(weekLater.getDate() + 7);

      const upcomingDeadlines = deadlineItems.filter(item => 
        item.deadline >= now && 
        item.deadline <= weekLater && 
        item.status !== 'завершен'
      );

      // Отправляем уведомления пользователю
      const connections = userConnections.get(userId);
      if (connections && connections.size > 0) {
        Array.from(connections).forEach(conn => {
          if (conn.readyState === WebSocket.OPEN) {
            conn.send(JSON.stringify({ 
              type: 'deadlines', 
              deadlines: upcomingDeadlines 
            }));
          }
        });
      }
    } catch (error) {
      console.error('Ошибка отправки уведомлений о дедлайнах:', error);
    }
  }

  // Функция для отправки обновлений всем подключенным клиентам
  function broadcastUpdate(type: string, data: any) {
    Array.from(userConnections.entries()).forEach(([userId, connections]) => {
      Array.from(connections).forEach(conn => {
        if (conn.readyState === WebSocket.OPEN) {
          conn.send(JSON.stringify({ type, data }));
        }
      });
    });
  }

  // Функция для отправки обновлений конкретному пользователю
  function sendUserUpdate(userId: number, type: string, data: any) {
    const connections = userConnections.get(userId);
    if (connections) {
      Array.from(connections).forEach(conn => {
        if (conn.readyState === WebSocket.OPEN) {
          conn.send(JSON.stringify({ type, data }));
        }
      });
    }
  }

  // Добавляем обновление уведомлений при изменении задач и проектов
  const originalCreateTask = storage.createProjectTask;
  storage.createProjectTask = async function(task) {
    const newTask = await originalCreateTask.call(storage, task);
    const project = await storage.getProject(task.projectId);
    if (project) {
      await sendDeadlineNotifications(project.userId);
    }
    return newTask;
  };

  const originalUpdateTask = storage.updateProjectTask;
  storage.updateProjectTask = async function(id, taskData) {
    const updatedTask = await originalUpdateTask.call(storage, id, taskData);
    const project = await storage.getProject(updatedTask.projectId);
    if (project) {
      await sendDeadlineNotifications(project.userId);
    }
    return updatedTask;
  };

  const originalUpdateProject = storage.updateProject;
  storage.updateProject = async function(id, projectData) {
    const updatedProject = await originalUpdateProject.call(storage, id, projectData);
    await sendDeadlineNotifications(updatedProject.userId);
    return updatedProject;
  };

  // АДМИНИСТРАТИВНЫЕ API

  // Получение всех пользователей
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      // В реальной системе это был бы метод getAllUsers в хранилище
      // Получаем всех пользователей из базы данных
      const allUsers = await Promise.all((await storage.getUsers()).map(async user => {
        // Скрываем пароли из ответа
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }));

      res.json({ success: true, users: allUsers });
    } catch (error: any) {
      console.error("Ошибка получения пользователей:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при получении пользователей" 
      });
    }
  });

  // Получение всех проектов (для администратора)
  app.get("/api/admin/projects", isAdmin, async (req, res) => {
    try {
      // Получаем все проекты из хранилища
      const allProjects = await storage.getAllProjects();

      // Для каждого проекта получаем задачи и комментарии
      const projectsWithDetails = await Promise.all(
        allProjects.map(async project => {
          const tasks = await storage.getProjectTasks(project.id);
          const comments = await storage.getProjectComments(project.id);
          return { 
            project, 
            tasks: tasks || [],
            comments: comments || []
          };
        })
      );

      // Формируем удобную структуру для клиента
      const tasksMap: Record<number, any[]> = {};
      const commentsMap: Record<number, any[]> = {};

      projectsWithDetails.forEach(item => {
        tasksMap[item.project.id] = item.tasks;
        commentsMap[item.project.id] = item.comments;
      });

      res.json({ 
        success: true, 
        projects: allProjects,
        tasks: tasksMap,
        comments: commentsMap
      });
    } catch (error: any) {
      console.error("Ошибка получения всех проектов:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при получении всех проектов" 
      });
    }
  });

  // Обновление статуса проекта администратором
  app.patch("/api/admin/projects/:projectId", isAdmin, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ success: false, message: "Неверный ID проекта" });
      }

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "Проект не найден" });
      }

      const updatedProject = await storage.updateProject(projectId, req.body);
      res.json({ success: true, project: updatedProject });
    } catch (error: any) {
      console.error("Ошибка обновления проекта:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при обновлении проекта" 
      });
    }
  });

  // Получение всех сообщений контактной формы
  app.get("/api/admin/messages", isAdmin, async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json({ success: true, messages });
    } catch (error: any) {
      console.error("Ошибка получения сообщений:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при получении сообщений контактной формы" 
      });
    }
  });

  // Отметка сообщения как прочитанного
  app.patch("/api/admin/messages/:messageId", isAdmin, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      if (isNaN(messageId)) {
        return res.status(400).json({ success: false, message: "Неверный ID сообщения" });
      }

      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ success: false, message: "Сообщение не найдено" });
      }

      // Используем метод updateMessageStatus из хранилища
      const updatedMessage = await storage.updateMessageStatus(messageId, true);

      res.json({ success: true, message: updatedMessage });
    } catch (error: any) {
      console.error("Ошибка обновления сообщения:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при обновлении сообщения" 
      });
    }
  });

  // МАРШРУТЫ ДЛЯ ЧАТА МЕЖДУ АДМИНИСТРАТОРОМ И КЛИЕНТОМ

  // Загрузка файла в чат
  const chatStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Создаем поддиректорию для файлов чата
      const chatDir = join(uploadDir, 'chat');

      if (!existsSync(chatDir)) {
        mkdirSync(chatDir, { recursive: true });
      }

      cb(null, chatDir);
    },
    filename: function (req, file, cb) {
      // Генерируем уникальное имя файла
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      // Получаем расширение исходного файла
      const fileExt = file.originalname.split('.').pop();
      cb(null, `chat_${uniqueSuffix}.${fileExt}`);
    }
  });

  const uploadChatFile = multer({ 
    storage: chatStorage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB макс. размер файла для чата
    } 
  });

  // Получение сообщений чата для проекта между двумя пользователями
  app.get("/api/projects/:projectId/chat/:recipientId", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const recipientId = parseInt(req.params.recipientId);

      if (isNaN(projectId) || isNaN(recipientId)) {
        return res.status(400).json({ success: false, message: "Неверные параметры запроса" });
      }

      // Проверка существования проекта
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "Проект не найден" });
      }

      // Проверка доступа к проекту
      const currentUserId = req.user!.id;
      if (project.userId !== currentUserId && req.user!.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Нет доступа к проекту" });
      }

      // Получаем сообщения
      const messages = await storage.getChatMessages(projectId, currentUserId, recipientId);

      // Получаем информацию о пользователе-получателе
      const recipient = await storage.getUser(recipientId);

      if (!recipient) {
        console.error("Получатель не найден в чате проекта. ID:", recipientId);

        // Вместо ошибки отправляем пустой список сообщений с временным получателем
        const emptyRecipient = {
          id: recipientId,
          username: "Неизвестный пользователь",
          fullName: null,
          avatar: null,
          role: null
        };

        return res.json({ 
          success: true, 
          messages: [],
          recipient: emptyRecipient
        });
      }

      // Отправляем только необходимую информацию о получателе
      const { password, ...recipientInfo } = recipient;

      res.json({ 
        success: true, 
        messages,
        recipient: recipientInfo
      });
    } catch (error: any) {
      console.error("Ошибка получения сообщений чата:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при получении сообщений чата" 
      });
    }
  });

  // Получение всех непрочитанных сообщений для пользователя
  app.get("/api/chat/unread", isAuthenticated, async (req, res) => {
    try {
      const count = await storage.getUnreadChatMessagesCount(req.user!.id);
      res.json({ success: true, count });
    } catch (error: any) {
      console.error("Ошибка получения количества непрочитанных сообщений:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при получении количества непрочитанных сообщений" 
      });
    }
  });

  // API для админского прямого общения с клиентом (без привязки к проекту)
  app.get("/api/chat/direct/:recipientId", isAuthenticated, async (req, res) => {
    try {
      const recipientId = parseInt(req.params.recipientId);

      if (isNaN(recipientId)) {
        return res.status(400).json({ success: false, message: "Неверный ID получателя" });
      }

      // Получаем информацию о получателе
      const recipient = await storage.getUser(recipientId);

      if (!recipient) {
        // Логируем ошибку при отладке
        console.error("Получатель не найден. ID:", recipientId);

        // Вместо ошибки отправляем пустой список сообщений
        // Это позволит интерфейсу корректно отображаться даже при отсутствии получателя
        const emptyRecipient = {
          id: recipientId,
          username: "Неизвестный пользователь",
          fullName: null,
          avatar: null,
          role: null
        };

        return res.json({ 
          success: true, 
          messages: [],
          recipient: emptyRecipient
        });
      }

      const userId = req.user!.id;

      // Для прямого общения используем специальный projectId = 0 (без привязки к проекту)
      const messages = await storage.getChatMessages(0, userId, recipientId);

      // Создаем объект с информацией о получателе (без пароля и других чувствительных данных)
      const recipientInfo = {
        id: recipient.id,
        username: recipient.username,
        fullName: recipient.fullName,
        avatar: recipient.avatar,
        role: recipient.role
      };

      res.json({ 
        success: true, 
        messages,
        recipient: recipientInfo
      });
    } catch (error: any) {
      console.error("Ошибка получения прямых сообщений чата:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при получении сообщений чата" 
      });
    }
  });

  // Отправка сообщения в чат
  app.post("/api/projects/:projectId/chat/:recipientId", isAuthenticated, uploadChatFile.single('attachment'), async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const recipientId = parseInt(req.params.recipientId);

      if (isNaN(projectId) || isNaN(recipientId)) {
        return res.status(400).json({ success: false, message: "Неверные параметры запроса" });
      }

      // Проверка существования проекта
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "Проект не найден" });
      }

      // Проверка доступа к проекту
      const currentUserId = req.user!.id;
      if (project.userId !== currentUserId && req.user!.role !== 'admin') {
        return res.status(403).json({ success: false, message: "Нет доступа к проекту" });
      }

      // Проверка существования получателя
      const recipient = await storage.getUser(recipientId);
      if (!recipient) {
        console.error("Получатель не найден при отправке сообщения в чат проекта. ID:", recipientId);
        // В этом случае вернем ошибку, так как требуется корректный пользователь для отправки
        return res.status(404).json({ 
          success: false, 
          message: "Получатель не найден. Возможно, пользователь был удален."
        });
      }

      // Создаем новое сообщение
      const messageData: InsertChatMessage = {
        projectId,
        userId: currentUserId,
        recipientId,
        content: req.body.content,
        isRead: false
      };

      // Если был загружен файл, добавляем информацию о нем
      if (req.file) {
        messageData.attachmentPath = req.file.path;
        messageData.attachmentName = req.file.originalname;
        messageData.attachmentType = req.file.mimetype;
        messageData.attachmentSize = req.file.size;
      }

      const message = await storage.createChatMessage(messageData);

      // Отправляем уведомление через WebSocket (если соединение активно)
      sendUserUpdate(recipientId, "new_message", {
        message,
        from: {
          id: req.user!.id,
          username: req.user!.username,
          fullName: req.user!.fullName
        }
      });

      res.status(201).json({ 
        success: true, 
        message
      });
    } catch (error: any) {
      console.error("Ошибка отправки сообщения:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при отправке сообщения" 
      });
    }
  });

  // Отправка прямого сообщения без привязки к проекту (для админов)
  app.post("/api/chat/direct/:recipientId", isAuthenticated, uploadChatFile.single('attachment'), async (req, res) => {
    try {
      const recipientId = parseInt(req.params.recipientId);

      if (isNaN(recipientId)) {
        return res.status(400).json({ success: false, message: "Неверный ID получателя" });
      }

      // Проверка прав на начало прямого общения (инициировать могут только админы)
      // Клиенты могут только отвечать на уже существующие диалоги
      if (req.user!.role !== 'admin') {
        // Проверяем, есть ли уже прямые сообщения между этими пользователями
        const existingMessages = await storage.getChatMessages(0, req.user!.id, recipientId);

        // Если сообщений нет, то клиент не может начать диалог
        if (existingMessages.length === 0) {
          return res.status(403).json({ 
            success: false, 
            message: "Вы не можете начать прямой диалог. Дождитесь, пока администратор свяжется с вами."
          });
        }
      }

      // Проверка существования получателя
      const recipientUser = await storage.getUser(recipientId);
      if (!recipientUser) {
        console.error("Получатель не найден при отправке сообщения. ID:", recipientId);
        // Вместо ошибки продолжаем, создавая сообщение для неизвестного пользователя
      }

      // Создаем новое сообщение без привязки к проекту (projectId = null)
      const messageData: InsertChatMessage = {
        projectId: null, // NULL для прямого общения (без привязки к проекту)
        userId: req.user!.id,
        recipientId,
        content: req.body.content,
        isRead: false
      };

      // Если был загружен файл, добавляем информацию о нем
      if (req.file) {
        messageData.attachmentPath = req.file.path;
        messageData.attachmentName = req.file.originalname;
        messageData.attachmentType = req.file.mimetype;
        messageData.attachmentSize = req.file.size;
      }

      const message = await storage.createChatMessage(messageData);

      // Отправляем уведомление через WebSocket (если соединение активно)
      sendUserUpdate(recipientId, "new_message", {
        message,
        from: {
          id: req.user!.id,
          username: req.user!.username,
          fullName: req.user!.fullName
        }
      });

      res.status(201).json({ 
        success: true, 
        message
      });
    } catch (error: any) {
      console.error("Ошибка отправки прямого сообщения:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при отправке сообщения" 
      });
    }
  });

  // Отметка сообщения чата как прочитанного
  app.patch("/api/chat/messages/:messageId/read", isAuthenticated, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      if (isNaN(messageId)) {
        return res.status(400).json({ success: false, message: "Неверный ID сообщения" });
      }

      // Обновляем статус сообщения
      const updatedMessage = await storage.markChatMessageAsRead(messageId);

      res.json({ 
        success: true, 
        message: updatedMessage 
      });
    } catch (error: any) {
      console.error("Ошибка обновления статуса сообщения:", error);
      res.status(500).json({ 
        success: false, 
        message: "Ошибка при обновлении статуса сообщения" 
      });
    }
  });

  return httpServer;
}