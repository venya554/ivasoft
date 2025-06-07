import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Схема пользователей
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").default("client").notNull(), // client, admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
  avatar: text("avatar"),
  company: text("company"),
  phone: text("phone"),
});

// Обратите внимание - связи будут определяться через внешние ключи

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true, 
  fullName: true,
  company: true,
  phone: true,
  role: true,
  createdAt: true,
});

// Схема для обновления профиля без пароля
export const updateUserProfileSchema = createInsertSchema(users)
  .omit({ password: true, role: true, id: true, createdAt: true, lastLogin: true })
  .partial();

// Схема входа
export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type Login = z.infer<typeof loginSchema>;

// Схема проектов
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").default("новый").notNull(), // новый, в работе, завершен, отменен
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deadline: text("deadline"),
  budget: text("budget"),
  category: text("category"),
});

// Связи через внешние ключи

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// Схема задач проекта
export const projectTasks = pgTable("project_tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("открыта").notNull(), // открыта, в работе, выполнена
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deadline: timestamp("deadline"),
  priority: text("priority").default("средний").notNull(), // низкий, средний, высокий
});

// Связи через внешние ключи projectTasks -> projects

export const insertProjectTaskSchema = createInsertSchema(projectTasks)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    deadline: z.string().optional().transform(val => {
      console.log("=== Валидация deadline ===");
      console.log("Исходное значение:", val);
      
      if (!val || val.trim() === '') {
        console.log("Пустое значение, возвращаем null");
        return null;
      }
      
      try {
        // Парсим дату из формата DD.MM.YYYY
        const [day, month, year] = val.split('.');
        console.log("Парсинг даты:", { day, month, year });
        
        if (day && month && year) {
          const dateStr = `${year}-${month}-${day}`;
          console.log("Преобразованная строка даты:", dateStr);
          const date = new Date(dateStr);
          
          if (!isNaN(date.getTime())) {
            console.log("Успешно преобразовано в дату:", date);
            return date;
          }
        }
        
        console.log("Неверный формат даты, возвращаем null");
        return null;
      } catch (error) {
        console.error("Ошибка преобразования в дату:", error);
        return null;
      }
    })
  })
  .transform((data) => {
    console.log("=== Валидация данных задачи ===");
    console.log("Входящие данные:", data);
    console.log("Тип deadline:", typeof data.deadline);
    console.log("Значение deadline:", data.deadline);
    return data;
  });

export type InsertProjectTask = z.infer<typeof insertProjectTaskSchema>;
export type ProjectTask = typeof projectTasks.$inferSelect;

// Схема комментариев к проекту
export const projectComments = pgTable("project_comments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isInternal: boolean("is_internal").default(false), // Внутренний комментарий виден только сотрудникам
});

// Связи через внешние ключи projectComments -> projects, projectComments -> users

export const insertProjectCommentSchema = createInsertSchema(projectComments).omit({
  id: true,
  createdAt: true,
});

export type InsertProjectComment = z.infer<typeof insertProjectCommentSchema>;
export type ProjectComment = typeof projectComments.$inferSelect;

// Схема файлов проекта
export const projectFiles = pgTable("project_files", {
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
  fileType: text("file_type"), // документ, изображение, архив и т.д.
});

// Связи через внешние ключи projectFiles -> projects, projectFiles -> users

export const insertProjectFileSchema = createInsertSchema(projectFiles).omit({
  id: true,
  uploadedAt: true,
});

export type InsertProjectFile = z.infer<typeof insertProjectFileSchema>;
export type ProjectFile = typeof projectFiles.$inferSelect;

// Схема контактных сообщений
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isRead: boolean("is_read").default(false).notNull(),
});

export const contactMessageSchema = z.object({
  name: z.string().min(2, { message: "Имя должно содержать минимум 2 символа" }),
  email: z.string().email({ message: "Введите корректный email адрес" }),
  subject: z.string().min(3, { message: "Тема должна содержать минимум 3 символа" }),
  message: z.string().min(10, { message: "Сообщение должно содержать минимум 10 символов" }),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).pick({
  name: true,
  email: true,
  subject: true,
  message: true,
});

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

// Таблица сообщений в чате между администратором и клиентом
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  userId: integer("user_id").references(() => users.id).notNull(), // Отправитель
  recipientId: integer("recipient_id").references(() => users.id).notNull(), // Получатель
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  attachmentPath: text("attachment_path"), // Путь к прикрепленному файлу, если есть
  attachmentName: text("attachment_name"), // Оригинальное имя файла
  attachmentType: text("attachment_type"), // Тип файла (MIME)
  attachmentSize: integer("attachment_size"), // Размер файла в байтах
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;