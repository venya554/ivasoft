var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  chatMessages: () => chatMessages,
  contactMessageSchema: () => contactMessageSchema,
  contactMessages: () => contactMessages,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertContactMessageSchema: () => insertContactMessageSchema,
  insertProjectCommentSchema: () => insertProjectCommentSchema,
  insertProjectFileSchema: () => insertProjectFileSchema,
  insertProjectSchema: () => insertProjectSchema,
  insertProjectTaskSchema: () => insertProjectTaskSchema,
  insertUserSchema: () => insertUserSchema,
  loginSchema: () => loginSchema,
  projectComments: () => projectComments,
  projectFiles: () => projectFiles,
  projectTasks: () => projectTasks,
  projects: () => projects,
  updateUserProfileSchema: () => updateUserProfileSchema,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").default("client").notNull(),
  // client, admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
  avatar: text("avatar"),
  company: text("company"),
  phone: text("phone")
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  company: true,
  phone: true,
  role: true,
  createdAt: true
});
var updateUserProfileSchema = createInsertSchema(users).omit({ password: true, role: true, id: true, createdAt: true, lastLogin: true }).partial();
var loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});
var projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").default("\u043D\u043E\u0432\u044B\u0439").notNull(),
  // новый, в работе, завершен, отменен
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deadline: text("deadline"),
  budget: text("budget"),
  category: text("category")
});
var insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var projectTasks = pgTable("project_tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("\u043E\u0442\u043A\u0440\u044B\u0442\u0430").notNull(),
  // открыта, в работе, выполнена
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deadline: timestamp("deadline"),
  priority: text("priority").default("\u0441\u0440\u0435\u0434\u043D\u0438\u0439").notNull()
  // низкий, средний, высокий
});
var insertProjectTaskSchema = createInsertSchema(projectTasks).omit({
  id: true,
  createdAt: true
}).extend({
  deadline: z.string().optional().transform((val) => {
    console.log("=== \u0412\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u044F deadline ===");
    console.log("\u0418\u0441\u0445\u043E\u0434\u043D\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435:", val);
    if (!val || val.trim() === "") {
      console.log("\u041F\u0443\u0441\u0442\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435, \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u043C null");
      return null;
    }
    try {
      const [day, month, year] = val.split(".");
      console.log("\u041F\u0430\u0440\u0441\u0438\u043D\u0433 \u0434\u0430\u0442\u044B:", { day, month, year });
      if (day && month && year) {
        const dateStr = `${year}-${month}-${day}`;
        console.log("\u041F\u0440\u0435\u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430 \u0434\u0430\u0442\u044B:", dateStr);
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          console.log("\u0423\u0441\u043F\u0435\u0448\u043D\u043E \u043F\u0440\u0435\u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u043E \u0432 \u0434\u0430\u0442\u0443:", date);
          return date;
        }
      }
      console.log("\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u0434\u0430\u0442\u044B, \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u043C null");
      return null;
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0435\u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u0438\u044F \u0432 \u0434\u0430\u0442\u0443:", error);
      return null;
    }
  })
}).transform((data) => {
  console.log("=== \u0412\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u044F \u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u0430\u0434\u0430\u0447\u0438 ===");
  console.log("\u0412\u0445\u043E\u0434\u044F\u0449\u0438\u0435 \u0434\u0430\u043D\u043D\u044B\u0435:", data);
  console.log("\u0422\u0438\u043F deadline:", typeof data.deadline);
  console.log("\u0417\u043D\u0430\u0447\u0435\u043D\u0438\u0435 deadline:", data.deadline);
  return data;
});
var projectComments = pgTable("project_comments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isInternal: boolean("is_internal").default(false)
  // Внутренний комментарий виден только сотрудникам
});
var insertProjectCommentSchema = createInsertSchema(projectComments).omit({
  id: true,
  createdAt: true
});
var projectFiles = pgTable("project_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  userId: integer("user_id").notNull().references(() => users.id),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  description: text("description"),
  fileType: text("file_type")
  // документ, изображение, архив и т.д.
});
var insertProjectFileSchema = createInsertSchema(projectFiles).omit({
  id: true,
  uploadedAt: true
});
var contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isRead: boolean("is_read").default(false).notNull()
});
var contactMessageSchema = z.object({
  name: z.string().min(2, { message: "\u0418\u043C\u044F \u0434\u043E\u043B\u0436\u043D\u043E \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0443\u043C 2 \u0441\u0438\u043C\u0432\u043E\u043B\u0430" }),
  email: z.string().email({ message: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 email \u0430\u0434\u0440\u0435\u0441" }),
  subject: z.string().min(3, { message: "\u0422\u0435\u043C\u0430 \u0434\u043E\u043B\u0436\u043D\u0430 \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0443\u043C 3 \u0441\u0438\u043C\u0432\u043E\u043B\u0430" }),
  message: z.string().min(10, { message: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0434\u043E\u043B\u0436\u043D\u043E \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C \u043C\u0438\u043D\u0438\u043C\u0443\u043C 10 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432" })
});
var insertContactMessageSchema = createInsertSchema(contactMessages).pick({
  name: true,
  email: true,
  subject: true,
  message: true
});
var chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  userId: integer("user_id").references(() => users.id).notNull(),
  // Отправитель
  recipientId: integer("recipient_id").references(() => users.id).notNull(),
  // Получатель
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  attachmentPath: text("attachment_path"),
  // Путь к прикрепленному файлу, если есть
  attachmentName: text("attachment_name"),
  // Оригинальное имя файла
  attachmentType: text("attachment_type"),
  // Тип файла (MIME)
  attachmentSize: integer("attachment_size")
  // Размер файла в байтах
});
var insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
var sqlite = new Database("./database.sqlite");
var db = drizzle(sqlite, { schema: schema_exports });

// server/storage.ts
import { eq, and, desc, or, sql } from "drizzle-orm";
import session from "express-session";
import SQLiteStore from "connect-sqlite3";
var DatabaseStorage = class {
  sessionStore;
  constructor() {
    const SqliteStore = SQLiteStore(session);
    this.sessionStore = new SqliteStore({
      db: "sessions.sqlite",
      table: "sessions"
    });
  }
  // Пользователи
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUserProfile(id, profile) {
    const [user] = await db.update(users).set(profile).where(eq(users.id, id)).returning();
    return user;
  }
  async updateUserPassword(username, password) {
    try {
      const [user] = await db.update(users).set({ password }).where(eq(users.username, username)).returning({ id: users.id });
      return !!user;
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u043F\u0430\u0440\u043E\u043B\u044F:", error);
      return false;
    }
  }
  // Проекты
  async getProject(id) {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }
  async getUserProjects(userId) {
    return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
  }
  async createProject(project) {
    const [createdProject] = await db.insert(projects).values(project).returning();
    return createdProject;
  }
  async updateProject(id, project) {
    const [updatedProject] = await db.update(projects).set({
      ...project,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(projects.id, id)).returning();
    return updatedProject;
  }
  // Задачи проекта
  async getProjectTasks(projectId) {
    return db.select().from(projectTasks).where(eq(projectTasks.projectId, projectId)).orderBy(desc(projectTasks.createdAt));
  }
  async createProjectTask(taskData) {
    console.log("=== Storage: createProjectTask ===");
    console.log("\u0418\u0441\u0445\u043E\u0434\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u0437\u0430\u0434\u0430\u0447\u0438:", taskData);
    console.log("\u0422\u0438\u043F deadline \u0434\u043E \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438:", typeof taskData.deadline);
    console.log("\u0417\u043D\u0430\u0447\u0435\u043D\u0438\u0435 deadline \u0434\u043E \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438:", taskData.deadline);
    let deadline = null;
    if (taskData.deadline && typeof taskData.deadline === "string") {
      console.log("\u041D\u0430\u0447\u0438\u043D\u0430\u0435\u043C \u043F\u0430\u0440\u0441\u0438\u043D\u0433 \u0434\u0430\u0442\u044B:", taskData.deadline);
      try {
        const [day, month, year] = taskData.deadline.split(".");
        if (day && month && year) {
          const dateStr = `${year}-${month}-${day}`;
          console.log("\u041F\u0440\u0435\u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430 \u0434\u0430\u0442\u044B:", dateStr);
          deadline = new Date(dateStr);
          console.log("\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u043F\u0440\u0435\u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u043D\u0438\u044F \u0432 Date:", deadline);
          console.log("\u0412\u0430\u043B\u0438\u0434\u043D\u0430\u044F \u0434\u0430\u0442\u0430:", !isNaN(deadline.getTime()));
        }
      } catch (error) {
        console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u0430\u0440\u0441\u0438\u043D\u0433\u0435 \u0434\u0430\u0442\u044B:", error);
      }
    }
    const processedTask = {
      ...taskData,
      deadline
    };
    console.log("\u041E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u0437\u0430\u0434\u0430\u0447\u0438:", processedTask);
    console.log("\u0422\u0438\u043F deadline \u043F\u043E\u0441\u043B\u0435 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438:", typeof processedTask.deadline);
    console.log("\u0417\u043D\u0430\u0447\u0435\u043D\u0438\u0435 deadline \u043F\u043E\u0441\u043B\u0435 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438:", processedTask.deadline);
    try {
      const result = await db.insert(projectTasks).values(processedTask).returning();
      console.log("\u0417\u0430\u0434\u0430\u0447\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D\u0430:", result);
      return result;
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0437\u0430\u0434\u0430\u0447\u0438 \u0432 \u0411\u0414:", error);
      throw error;
    }
  }
  async updateProjectTask(id, task) {
    const [updatedTask] = await db.update(projectTasks).set(task).where(eq(projectTasks.id, id)).returning();
    return updatedTask;
  }
  // Комментарии к проекту
  async getProjectComments(projectId) {
    return db.select().from(projectComments).where(eq(projectComments.projectId, projectId)).orderBy(desc(projectComments.createdAt));
  }
  async createProjectComment(comment) {
    const [createdComment] = await db.insert(projectComments).values(comment).returning();
    return createdComment;
  }
  // Файлы проекта
  async getProjectFiles(projectId) {
    return db.select().from(projectFiles).where(eq(projectFiles.projectId, projectId)).orderBy(desc(projectFiles.uploadedAt));
  }
  async getProjectFile(fileId) {
    const [file] = await db.select().from(projectFiles).where(eq(projectFiles.id, fileId));
    return file;
  }
  async createProjectFile(file) {
    const [createdFile] = await db.insert(projectFiles).values(file).returning();
    return createdFile;
  }
  // Контактные сообщения
  async createMessage(message) {
    const [createdMessage] = await db.insert(contactMessages).values(message).returning();
    return createdMessage;
  }
  async getMessages() {
    return db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }
  async getMessage(id) {
    const [message] = await db.select().from(contactMessages).where(eq(contactMessages.id, id));
    return message;
  }
  async updateMessageStatus(id, isRead) {
    const [updatedMessage] = await db.update(contactMessages).set({ isRead }).where(eq(contactMessages.id, id)).returning();
    return updatedMessage;
  }
  // Административные методы
  async getUsers() {
    return db.select().from(users).orderBy(users.username);
  }
  async getAllProjects() {
    return db.select().from(projects).orderBy(desc(projects.createdAt));
  }
  // Методы для работы с чатом
  async getChatMessages(projectId, userId, recipientId) {
    const conditions = or(
      and(
        eq(chatMessages.userId, userId),
        eq(chatMessages.recipientId, recipientId)
      ),
      and(
        eq(chatMessages.userId, recipientId),
        eq(chatMessages.recipientId, userId)
      )
    );
    return db.select().from(chatMessages).where(
      projectId === 0 ? conditions : and(
        eq(chatMessages.projectId, projectId),
        conditions
        // Для чата в проекте - проверяем и проект, и пользователей
      )
    ).orderBy(chatMessages.createdAt);
  }
  async getChatMessagesForUser(userId) {
    return db.select().from(chatMessages).where(
      or(
        eq(chatMessages.userId, userId),
        eq(chatMessages.recipientId, userId)
      )
    ).orderBy(desc(chatMessages.createdAt));
  }
  async getUnreadChatMessagesCount(userId) {
    const result = await db.select({ count: sql`count(*)` }).from(chatMessages).where(
      and(
        eq(chatMessages.recipientId, userId),
        eq(chatMessages.isRead, false)
      )
    );
    return result[0]?.count || 0;
  }
  async createChatMessage(message) {
    const [createdMessage] = await db.insert(chatMessages).values(message).returning();
    return createdMessage;
  }
  async markChatMessageAsRead(id) {
    const [updatedMessage] = await db.update(chatMessages).set({ isRead: true }).where(eq(chatMessages.id, id)).returning();
    return updatedMessage;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import nodemailer from "nodemailer";
import { fromZodError } from "zod-validation-error";

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session2 from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
var scryptAsync = promisify(scrypt);
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}
async function createAdminIfNotExists() {
  try {
    const adminUser = await storage.getUserByUsername("admin");
    if (!adminUser) {
      console.log("\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u0441 \u043F\u0440\u0430\u0432\u0430\u043C\u0438 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430...");
      const adminPassword = "Jingle2018";
      await storage.createUser({
        username: "admin",
        password: await hashPassword(adminPassword),
        email: "admin@ivasoft.ru",
        fullName: "\u0410\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440 \u0441\u0438\u0441\u0442\u0435\u043C\u044B",
        role: "admin",
        createdAt: /* @__PURE__ */ new Date()
      });
      console.log("\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441 \u043F\u0440\u0430\u0432\u0430\u043C\u0438 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u043D");
    }
  } catch (error) {
    console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430:", error);
  }
}
function setupAuth(app2) {
  if (!process.env.SESSION_SECRET) {
    console.warn("SESSION_SECRET environment variable not set. Using default secret.");
  }
  createAdminIfNotExists();
  const sessionSettings = {
    secret: process.env.SESSION_SECRET || "ivasoft-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1e3 * 60 * 60 * 24 * 7
      // 7 дней
    }
  };
  app2.set("trust proxy", 1);
  app2.use(session2(sessionSettings));
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !await comparePasswords(password, user.password)) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    })
  );
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });
  app2.post("/api/register", async (req, res, next) => {
    try {
      const existingUserByUsername = await storage.getUserByUsername(req.body.username);
      if (existingUserByUsername) {
        return res.status(400).json({ success: false, message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441 \u0442\u0430\u043A\u0438\u043C \u0438\u043C\u0435\u043D\u0435\u043C \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442" });
      }
      const existingUserByEmail = await storage.getUserByEmail(req.body.email);
      if (existingUserByEmail) {
        return res.status(400).json({ success: false, message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0441 \u0442\u0430\u043A\u0438\u043C email \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442" });
      }
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password)
      });
      const { password, ...userWithoutPassword } = user;
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ success: true, user: userWithoutPassword });
      });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438:", error);
      res.status(500).json({ success: false, message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F" });
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ success: false, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u043E\u0435 \u0438\u043C\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C" });
      }
      req.login(user, (err2) => {
        if (err2) return next(err2);
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json({ success: true, user: userWithoutPassword });
      });
    })(req, res, next);
  });
  app2.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  app2.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" });
    }
    const { password, ...userWithoutPassword } = req.user;
    res.json({ success: true, user: userWithoutPassword });
  });
  app2.put("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ success: false, message: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" });
    }
    try {
      const user = await storage.updateUserProfile(req.user.id, req.body);
      const { password, ...userWithoutPassword } = user;
      res.json({ success: true, user: userWithoutPassword });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u043F\u0440\u043E\u0444\u0438\u043B\u044F:", error);
      res.status(500).json({ success: false, message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u043F\u0440\u043E\u0444\u0438\u043B\u044F" });
    }
  });
  app2.put("/api/user/password", async (req, res) => {
    if (!req.isAuthenticated() && req.body.username !== "admin") {
      return res.status(401).json({ success: false, message: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" });
    }
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ success: false, message: "\u041E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0443\u044E\u0442 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u043F\u043E\u043B\u044F" });
      }
      const hashedPassword = await hashPassword(password);
      const success = await storage.updateUserPassword(username, hashedPassword);
      if (success) {
        return res.json({ success: true, message: "\u041F\u0430\u0440\u043E\u043B\u044C \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D" });
      } else {
        return res.status(404).json({ success: false, message: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
      }
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u043F\u0430\u0440\u043E\u043B\u044F:", error);
      res.status(500).json({ success: false, message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u043F\u0430\u0440\u043E\u043B\u044F" });
    }
  });
}

// server/routes.ts
import multer from "multer";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { WebSocketServer, WebSocket } from "ws";
var uploadDir = join(process.cwd(), "uploads");
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}
var storage_config = multer.diskStorage({
  destination: function(req, file, cb) {
    const projectId = req.params.projectId;
    const projectDir = join(uploadDir, projectId);
    if (!existsSync(projectDir)) {
      mkdirSync(projectDir, { recursive: true });
    }
    cb(null, projectDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileExt = file.originalname.split(".").pop();
    cb(null, `${uniqueSuffix}.${fileExt}`);
  }
});
var upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB макс. размер файла
  }
});
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ success: false, message: "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D" });
}
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ success: false, message: "\u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D. \u0422\u0440\u0435\u0431\u0443\u044E\u0442\u0441\u044F \u043F\u0440\u0430\u0432\u0430 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430." });
}
async function registerRoutes(app2) {
  setupAuth(app2);
  app2.use("/uploads", isAuthenticated, express.static(uploadDir));
  app2.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const projects3 = await storage.getUserProjects(req.user.id);
      res.json({ success: true, projects: projects3 });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043F\u0440\u043E\u0435\u043A\u0442\u043E\u0432:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u043F\u0440\u043E\u0435\u043A\u0442\u043E\u0432"
      });
    }
  });
  app2.get("/api/admins", isAuthenticated, async (req, res) => {
    try {
      const users3 = await storage.getUsers();
      const admins = users3.filter((user) => user.role === "admin").map((admin) => ({
        id: admin.id,
        username: admin.username,
        fullName: admin.fullName,
        avatar: admin.avatar,
        role: admin.role
      }));
      res.json({ success: true, admins });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u043F\u0438\u0441\u043A\u0430 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u043E\u0432:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043F\u0438\u0441\u043A\u0430 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u043E\u0432"
      });
    }
  });
  app2.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ success: false, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ID \u043F\u0440\u043E\u0435\u043A\u0442\u0430" });
      }
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "\u041F\u0440\u043E\u0435\u043A\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
      }
      if (project.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u043F\u0440\u043E\u0435\u043A\u0442\u0443" });
      }
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
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043F\u0440\u043E\u0435\u043A\u0442\u0430:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445 \u043F\u0440\u043E\u0435\u043A\u0442\u0430"
      });
    }
  });
  app2.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      const project = await storage.createProject(projectData);
      res.status(201).json({ success: true, project });
    } catch (error) {
      if (error?.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({
          success: false,
          message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445 \u043F\u0440\u043E\u0435\u043A\u0442\u0430",
          errors: validationError.details
        });
      } else {
        console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043F\u0440\u043E\u0435\u043A\u0442\u0430:", error);
        res.status(500).json({
          success: false,
          message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u043F\u0440\u043E\u0435\u043A\u0442\u0430"
        });
      }
    }
  });
  app2.put("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ success: false, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ID \u043F\u0440\u043E\u0435\u043A\u0442\u0430" });
      }
      const existingProject = await storage.getProject(projectId);
      if (!existingProject) {
        return res.status(404).json({ success: false, message: "\u041F\u0440\u043E\u0435\u043A\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
      }
      if (existingProject.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u043F\u0440\u043E\u0435\u043A\u0442\u0443" });
      }
      const updatedProject = await storage.updateProject(projectId, req.body);
      res.json({ success: true, project: updatedProject });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043F\u0440\u043E\u0435\u043A\u0442\u0430:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u043F\u0440\u043E\u0435\u043A\u0442\u0430"
      });
    }
  });
  app2.get("/api/projects/:projectId/tasks", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ success: false, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ID \u043F\u0440\u043E\u0435\u043A\u0442\u0430" });
      }
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "\u041F\u0440\u043E\u0435\u043A\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
      }
      if (project.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u043F\u0440\u043E\u0435\u043A\u0442\u0443" });
      }
      const tasks = await storage.getProjectTasks(projectId);
      res.json({ success: true, tasks });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0437\u0430\u0434\u0430\u0447:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0437\u0430\u0434\u0430\u0447 \u043F\u0440\u043E\u0435\u043A\u0442\u0430"
      });
    }
  });
  app2.post("/api/projects/:projectId/tasks", isAuthenticated, async (req, res) => {
    try {
      console.log("=== \u041D\u0430\u0447\u0430\u043B\u043E \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0437\u0430\u0434\u0430\u0447\u0438 ===");
      console.log("\u0422\u0435\u043B\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u0430:", req.body);
      console.log("\u0417\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0438 \u0437\u0430\u043F\u0440\u043E\u0441\u0430:", req.headers);
      const projectId = parseInt(req.params.projectId);
      console.log("ID \u043F\u0440\u043E\u0435\u043A\u0442\u0430:", projectId);
      console.log("\u0422\u0438\u043F deadline:", typeof req.body.deadline);
      console.log("\u0417\u043D\u0430\u0447\u0435\u043D\u0438\u0435 deadline:", req.body.deadline);
      if (isNaN(projectId)) {
        console.log("\u041E\u0448\u0438\u0431\u043A\u0430: \u043D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ID \u043F\u0440\u043E\u0435\u043A\u0442\u0430");
        return res.status(400).json({ success: false, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ID \u043F\u0440\u043E\u0435\u043A\u0442\u0430" });
      }
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "\u041F\u0440\u043E\u0435\u043A\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
      }
      if (project.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u043F\u0440\u043E\u0435\u043A\u0442\u0443" });
      }
      console.log("\u0414\u0430\u043D\u043D\u044B\u0435 \u0434\u043B\u044F \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438:", {
        ...req.body,
        projectId
      });
      const taskData = insertProjectTaskSchema.parse({
        ...req.body,
        projectId
      });
      console.log("\u0414\u0430\u043D\u043D\u044B\u0435 \u043F\u043E\u0441\u043B\u0435 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438:", taskData);
      const task = await storage.createProjectTask(taskData);
      console.log("\u0417\u0430\u0434\u0430\u0447\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0430 \u0443\u0441\u043F\u0435\u0448\u043D\u043E:", task);
      res.status(201).json({ success: true, task });
    } catch (error) {
      if (error?.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({
          success: false,
          message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445 \u0437\u0430\u0434\u0430\u0447\u0438",
          errors: validationError.details
        });
      } else {
        console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0437\u0430\u0434\u0430\u0447\u0438:", error);
        res.status(500).json({
          success: false,
          message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0437\u0430\u0434\u0430\u0447\u0438"
        });
      }
    }
  });
  app2.put("/api/projects/:projectId/tasks/:taskId", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const taskId = parseInt(req.params.taskId);
      if (isNaN(projectId) || isNaN(taskId)) {
        return res.status(400).json({ success: false, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0437\u0430\u043F\u0440\u043E\u0441\u0430" });
      }
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "\u041F\u0440\u043E\u0435\u043A\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
      }
      if (project.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u043F\u0440\u043E\u0435\u043A\u0442\u0443" });
      }
      const updatedTask = await storage.updateProjectTask(taskId, req.body);
      res.json({ success: true, task: updatedTask });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0437\u0430\u0434\u0430\u0447\u0438:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0437\u0430\u0434\u0430\u0447\u0438"
      });
    }
  });
  app2.get("/api/projects/:projectId/comments", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ success: false, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ID \u043F\u0440\u043E\u0435\u043A\u0442\u0430" });
      }
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "\u041F\u0440\u043E\u0435\u043A\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
      }
      if (project.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u043F\u0440\u043E\u0435\u043A\u0442\u0443" });
      }
      const comments = await storage.getProjectComments(projectId);
      res.json({ success: true, comments });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0435\u0432:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0435\u0432"
      });
    }
  });
  app2.get("/api/projects/:projectId/files", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ success: false, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ID \u043F\u0440\u043E\u0435\u043A\u0442\u0430" });
      }
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "\u041F\u0440\u043E\u0435\u043A\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
      }
      if (project.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u043F\u0440\u043E\u0435\u043A\u0442\u0443" });
      }
      const files = await storage.getProjectFiles(projectId);
      res.json({ success: true, files });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0444\u0430\u0439\u043B\u043E\u0432:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0444\u0430\u0439\u043B\u043E\u0432 \u043F\u0440\u043E\u0435\u043A\u0442\u0430"
      });
    }
  });
  app2.post("/api/projects/:projectId/files", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ success: false, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ID \u043F\u0440\u043E\u0435\u043A\u0442\u0430" });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, message: "\u0424\u0430\u0439\u043B \u043D\u0435 \u0431\u044B\u043B \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D" });
      }
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "\u041F\u0440\u043E\u0435\u043A\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
      }
      if (project.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u043F\u0440\u043E\u0435\u043A\u0442\u0443" });
      }
      const fileData = {
        projectId,
        userId: req.user.id,
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
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438 \u0444\u0430\u0439\u043B\u0430:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u0444\u0430\u0439\u043B\u0430"
      });
    }
  });
  app2.get("/api/files/:fileId", isAuthenticated, async (req, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      if (isNaN(fileId)) {
        return res.status(400).json({ success: false, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ID \u0444\u0430\u0439\u043B\u0430" });
      }
      const file = await storage.getProjectFile(fileId);
      if (!file) {
        return res.status(404).json({ success: false, message: "\u0424\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
      }
      const project = await storage.getProject(file.projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "\u041F\u0440\u043E\u0435\u043A\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
      }
      if (project.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u0444\u0430\u0439\u043B\u0443" });
      }
      res.sendFile(file.path, { root: "." });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0444\u0430\u0439\u043B\u0430:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0444\u0430\u0439\u043B\u0430"
      });
    }
  });
  app2.post("/api/projects/:projectId/comments", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ success: false, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ID \u043F\u0440\u043E\u0435\u043A\u0442\u0430" });
      }
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "\u041F\u0440\u043E\u0435\u043A\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
      }
      if (project.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u043F\u0440\u043E\u0435\u043A\u0442\u0443" });
      }
      const commentData = insertProjectCommentSchema.parse({
        ...req.body,
        projectId,
        userId: req.user.id
      });
      const comment = await storage.createProjectComment(commentData);
      res.status(201).json({ success: true, comment });
    } catch (error) {
      if (error?.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({
          success: false,
          message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445 \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u044F",
          errors: validationError.details
        });
      } else {
        console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u044F:", error);
        res.status(500).json({
          success: false,
          message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u044F"
        });
      }
    }
  });
  const emailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.example.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "user@example.com",
      pass: process.env.SMTP_PASS || "password"
    }
  });
  app2.post("/api/contact", async (req, res) => {
    try {
      const validatedData = contactMessageSchema.parse(req.body);
      const savedMessage = await storage.createMessage(validatedData);
      try {
        await emailTransport.sendMail({
          from: process.env.EMAIL_FROM || "no-reply@ivasoft.ru",
          to: process.env.EMAIL_TO || "ivasoft@internet.ru",
          subject: `\u041D\u043E\u0432\u043E\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435: ${validatedData.subject}`,
          text: `
            \u0418\u043C\u044F: ${validatedData.name}
            Email: ${validatedData.email}
            \u0422\u0435\u043C\u0430: ${validatedData.subject}

            \u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435:
            ${validatedData.message}
          `,
          html: `
            <strong>\u0418\u043C\u044F:</strong> ${validatedData.name}<br>
            <strong>Email:</strong> ${validatedData.email}<br>
            <strong>\u0422\u0435\u043C\u0430:</strong> ${validatedData.subject}<br>
            <br>
            <strong>\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435:</strong><br>
            ${validatedData.message.replace(/\n/g, "<br>")}
          `
        });
      } catch (emailError) {
        console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 email:", emailError);
      }
      res.status(201).json({
        success: true,
        message: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E",
        id: savedMessage.id
      });
    } catch (error) {
      if (error?.name === "ZodError") {
        const validationError = fromZodError(error);
        res.status(400).json({
          success: false,
          message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438 \u0434\u0430\u043D\u043D\u044B\u0445",
          errors: validationError.details
        });
      } else {
        console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u043E\u0439 \u0444\u043E\u0440\u043C\u044B:", error);
        res.status(500).json({
          success: false,
          message: "\u041F\u0440\u043E\u0438\u0437\u043E\u0448\u043B\u0430 \u043E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435 \u0437\u0430\u043F\u0440\u043E\u0441\u0430"
        });
      }
    }
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  const userConnections = /* @__PURE__ */ new Map();
  function heartbeat() {
    this.isAlive = true;
  }
  wss.on("connection", (ws, req) => {
    console.log("WebSocket \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E");
    const sessionParser = req.rawHeaders.indexOf("Cookie") !== -1 ? req.rawHeaders[req.rawHeaders.indexOf("Cookie") + 1] : "";
    ws.send(JSON.stringify({
      type: "connection",
      message: "\u0421\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 \u0441 \u0441\u0435\u0440\u0432\u0435\u0440\u043E\u043C \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E \u0443\u0441\u043F\u0435\u0448\u043D\u043E"
    }));
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === "auth" && data.userId) {
          const userId = parseInt(data.userId);
          if (!userConnections.has(userId)) {
            userConnections.set(userId, /* @__PURE__ */ new Set());
          }
          userConnections.get(userId)?.add(ws);
          await sendDeadlineNotifications(userId);
          console.log(`\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C ${userId} \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D \u0447\u0435\u0440\u0435\u0437 WebSocket`);
        }
      } catch (error) {
        console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 WebSocket \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F:", error);
      }
    });
    ws.isAlive = true;
    ws.on("pong", heartbeat);
    ws.on("close", () => {
      Array.from(userConnections.entries()).forEach(([userId, connections]) => {
        if (connections.has(ws)) {
          connections.delete(ws);
          if (connections.size === 0) {
            userConnections.delete(userId);
          }
          return;
        }
      });
      console.log("WebSocket \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 \u0437\u0430\u043A\u0440\u044B\u0442\u043E");
    });
  });
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 3e4);
  wss.on("close", () => {
    clearInterval(interval);
  });
  async function sendDeadlineNotifications(userId) {
    try {
      const projects3 = await storage.getUserProjects(userId);
      let deadlineItems = [];
      const projectDeadlines = projects3.filter((p) => p.deadline).map((p) => ({
        id: p.id,
        projectId: p.id,
        projectTitle: p.title,
        title: p.title,
        deadline: new Date(p.deadline),
        type: "project",
        status: p.status
      }));
      deadlineItems.push(...projectDeadlines);
      for (const project of projects3) {
        const tasks = await storage.getProjectTasks(project.id);
        const taskDeadlines = tasks.filter((t) => t.deadline).map((t) => ({
          id: t.id,
          projectId: project.id,
          projectTitle: project.title,
          title: t.title,
          deadline: new Date(t.deadline),
          type: "task",
          status: t.status
        }));
        deadlineItems.push(...taskDeadlines);
      }
      deadlineItems.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
      const now = /* @__PURE__ */ new Date();
      const weekLater = /* @__PURE__ */ new Date();
      weekLater.setDate(weekLater.getDate() + 7);
      const upcomingDeadlines = deadlineItems.filter(
        (item) => item.deadline >= now && item.deadline <= weekLater && item.status !== "\u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D"
      );
      const connections = userConnections.get(userId);
      if (connections && connections.size > 0) {
        Array.from(connections).forEach((conn) => {
          if (conn.readyState === WebSocket.OPEN) {
            conn.send(JSON.stringify({
              type: "deadlines",
              deadlines: upcomingDeadlines
            }));
          }
        });
      }
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0439 \u043E \u0434\u0435\u0434\u043B\u0430\u0439\u043D\u0430\u0445:", error);
    }
  }
  function broadcastUpdate(type, data) {
    Array.from(userConnections.entries()).forEach(([userId, connections]) => {
      Array.from(connections).forEach((conn) => {
        if (conn.readyState === WebSocket.OPEN) {
          conn.send(JSON.stringify({ type, data }));
        }
      });
    });
  }
  function sendUserUpdate(userId, type, data) {
    const connections = userConnections.get(userId);
    if (connections) {
      Array.from(connections).forEach((conn) => {
        if (conn.readyState === WebSocket.OPEN) {
          conn.send(JSON.stringify({ type, data }));
        }
      });
    }
  }
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
  app2.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const allUsers = await Promise.all((await storage.getUsers()).map(async (user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }));
      res.json({ success: true, users: allUsers });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439"
      });
    }
  });
  app2.get("/api/admin/projects", isAdmin, async (req, res) => {
    try {
      const allProjects = await storage.getAllProjects();
      const projectsWithDetails = await Promise.all(
        allProjects.map(async (project) => {
          const tasks = await storage.getProjectTasks(project.id);
          const comments = await storage.getProjectComments(project.id);
          return {
            project,
            tasks: tasks || [],
            comments: comments || []
          };
        })
      );
      const tasksMap = {};
      const commentsMap = {};
      projectsWithDetails.forEach((item) => {
        tasksMap[item.project.id] = item.tasks;
        commentsMap[item.project.id] = item.comments;
      });
      res.json({
        success: true,
        projects: allProjects,
        tasks: tasksMap,
        comments: commentsMap
      });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0432\u0441\u0435\u0445 \u043F\u0440\u043E\u0435\u043A\u0442\u043E\u0432:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0432\u0441\u0435\u0445 \u043F\u0440\u043E\u0435\u043A\u0442\u043E\u0432"
      });
    }
  });
  app2.patch("/api/admin/projects/:projectId", isAdmin, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ success: false, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ID \u043F\u0440\u043E\u0435\u043A\u0442\u0430" });
      }
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "\u041F\u0440\u043E\u0435\u043A\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
      }
      const updatedProject = await storage.updateProject(projectId, req.body);
      res.json({ success: true, project: updatedProject });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u043F\u0440\u043E\u0435\u043A\u0442\u0430:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u043F\u0440\u043E\u0435\u043A\u0442\u0430"
      });
    }
  });
  app2.get("/api/admin/messages", isAdmin, async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json({ success: true, messages });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u043E\u0439 \u0444\u043E\u0440\u043C\u044B"
      });
    }
  });
  app2.patch("/api/admin/messages/:messageId", isAdmin, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      if (isNaN(messageId)) {
        return res.status(400).json({ success: false, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ID \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F" });
      }
      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ success: false, message: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E" });
      }
      const updatedMessage = await storage.updateMessageStatus(messageId, true);
      res.json({ success: true, message: updatedMessage });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F"
      });
    }
  });
  const chatStorage = multer.diskStorage({
    destination: function(req, file, cb) {
      const chatDir = join(uploadDir, "chat");
      if (!existsSync(chatDir)) {
        mkdirSync(chatDir, { recursive: true });
      }
      cb(null, chatDir);
    },
    filename: function(req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const fileExt = file.originalname.split(".").pop();
      cb(null, `chat_${uniqueSuffix}.${fileExt}`);
    }
  });
  const uploadChatFile = multer({
    storage: chatStorage,
    limits: {
      fileSize: 5 * 1024 * 1024
      // 5MB макс. размер файла для чата
    }
  });
  app2.get("/api/projects/:projectId/chat/:recipientId", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const recipientId = parseInt(req.params.recipientId);
      if (isNaN(projectId) || isNaN(recipientId)) {
        return res.status(400).json({ success: false, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0437\u0430\u043F\u0440\u043E\u0441\u0430" });
      }
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "\u041F\u0440\u043E\u0435\u043A\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
      }
      const currentUserId = req.user.id;
      if (project.userId !== currentUserId && req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u043F\u0440\u043E\u0435\u043A\u0442\u0443" });
      }
      const messages = await storage.getChatMessages(projectId, currentUserId, recipientId);
      const recipient = await storage.getUser(recipientId);
      if (!recipient) {
        console.error("\u041F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0432 \u0447\u0430\u0442\u0435 \u043F\u0440\u043E\u0435\u043A\u0442\u0430. ID:", recipientId);
        const emptyRecipient = {
          id: recipientId,
          username: "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C",
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
      const { password, ...recipientInfo } = recipient;
      res.json({
        success: true,
        messages,
        recipient: recipientInfo
      });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u0447\u0430\u0442\u0430:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u0447\u0430\u0442\u0430"
      });
    }
  });
  app2.get("/api/chat/unread", isAuthenticated, async (req, res) => {
    try {
      const count = await storage.getUnreadChatMessagesCount(req.user.id);
      res.json({ success: true, count });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u0430 \u043D\u0435\u043F\u0440\u043E\u0447\u0438\u0442\u0430\u043D\u043D\u044B\u0445 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u0430 \u043D\u0435\u043F\u0440\u043E\u0447\u0438\u0442\u0430\u043D\u043D\u044B\u0445 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439"
      });
    }
  });
  app2.get("/api/chat/direct/:recipientId", isAuthenticated, async (req, res) => {
    try {
      const recipientId = parseInt(req.params.recipientId);
      if (isNaN(recipientId)) {
        return res.status(400).json({ success: false, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ID \u043F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u044F" });
      }
      const recipient = await storage.getUser(recipientId);
      if (!recipient) {
        console.error("\u041F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D. ID:", recipientId);
        const emptyRecipient = {
          id: recipientId,
          username: "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C",
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
      const userId = req.user.id;
      const messages = await storage.getChatMessages(0, userId, recipientId);
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
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u043F\u0440\u044F\u043C\u044B\u0445 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u0447\u0430\u0442\u0430:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u0447\u0430\u0442\u0430"
      });
    }
  });
  app2.post("/api/projects/:projectId/chat/:recipientId", isAuthenticated, uploadChatFile.single("attachment"), async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const recipientId = parseInt(req.params.recipientId);
      if (isNaN(projectId) || isNaN(recipientId)) {
        return res.status(400).json({ success: false, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0435 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0437\u0430\u043F\u0440\u043E\u0441\u0430" });
      }
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ success: false, message: "\u041F\u0440\u043E\u0435\u043A\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
      }
      const currentUserId = req.user.id;
      if (project.userId !== currentUserId && req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u043F\u0440\u043E\u0435\u043A\u0442\u0443" });
      }
      const recipient = await storage.getUser(recipientId);
      if (!recipient) {
        console.error("\u041F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u043F\u0440\u0438 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0432 \u0447\u0430\u0442 \u043F\u0440\u043E\u0435\u043A\u0442\u0430. ID:", recipientId);
        return res.status(404).json({
          success: false,
          message: "\u041F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D. \u0412\u043E\u0437\u043C\u043E\u0436\u043D\u043E, \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0431\u044B\u043B \u0443\u0434\u0430\u043B\u0435\u043D."
        });
      }
      const messageData = {
        projectId,
        userId: currentUserId,
        recipientId,
        content: req.body.content,
        isRead: false
      };
      if (req.file) {
        messageData.attachmentPath = req.file.path;
        messageData.attachmentName = req.file.originalname;
        messageData.attachmentType = req.file.mimetype;
        messageData.attachmentSize = req.file.size;
      }
      const message = await storage.createChatMessage(messageData);
      sendUserUpdate(recipientId, "new_message", {
        message,
        from: {
          id: req.user.id,
          username: req.user.username,
          fullName: req.user.fullName
        }
      });
      res.status(201).json({
        success: true,
        message
      });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F"
      });
    }
  });
  app2.post("/api/chat/direct/:recipientId", isAuthenticated, uploadChatFile.single("attachment"), async (req, res) => {
    try {
      const recipientId = parseInt(req.params.recipientId);
      if (isNaN(recipientId)) {
        return res.status(400).json({ success: false, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ID \u043F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u044F" });
      }
      if (req.user.role !== "admin") {
        const existingMessages = await storage.getChatMessages(0, req.user.id, recipientId);
        if (existingMessages.length === 0) {
          return res.status(403).json({
            success: false,
            message: "\u0412\u044B \u043D\u0435 \u043C\u043E\u0436\u0435\u0442\u0435 \u043D\u0430\u0447\u0430\u0442\u044C \u043F\u0440\u044F\u043C\u043E\u0439 \u0434\u0438\u0430\u043B\u043E\u0433. \u0414\u043E\u0436\u0434\u0438\u0442\u0435\u0441\u044C, \u043F\u043E\u043A\u0430 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440 \u0441\u0432\u044F\u0436\u0435\u0442\u0441\u044F \u0441 \u0432\u0430\u043C\u0438."
          });
        }
      }
      const recipientUser = await storage.getUser(recipientId);
      if (!recipientUser) {
        console.error("\u041F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u043F\u0440\u0438 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F. ID:", recipientId);
      }
      const messageData = {
        projectId: null,
        // NULL для прямого общения (без привязки к проекту)
        userId: req.user.id,
        recipientId,
        content: req.body.content,
        isRead: false
      };
      if (req.file) {
        messageData.attachmentPath = req.file.path;
        messageData.attachmentName = req.file.originalname;
        messageData.attachmentType = req.file.mimetype;
        messageData.attachmentSize = req.file.size;
      }
      const message = await storage.createChatMessage(messageData);
      sendUserUpdate(recipientId, "new_message", {
        message,
        from: {
          id: req.user.id,
          username: req.user.username,
          fullName: req.user.fullName
        }
      });
      res.status(201).json({
        success: true,
        message
      });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u043F\u0440\u044F\u043C\u043E\u0433\u043E \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F"
      });
    }
  });
  app2.patch("/api/chat/messages/:messageId/read", isAuthenticated, async (req, res) => {
    try {
      const messageId = parseInt(req.params.messageId);
      if (isNaN(messageId)) {
        return res.status(400).json({ success: false, message: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ID \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F" });
      }
      const updatedMessage = await storage.markChatMessageAsRead(messageId);
      res.json({
        success: true,
        message: updatedMessage
      });
    } catch (error) {
      console.error("\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0441\u0442\u0430\u0442\u0443\u0441\u0430 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F:", error);
      res.status(500).json({
        success: false,
        message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0438 \u0441\u0442\u0430\u0442\u0443\u0441\u0430 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F"
      });
    }
  });
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
