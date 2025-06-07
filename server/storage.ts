import {
  users, 
  projects,
  projectTasks,
  projectComments,
  projectFiles,
  contactMessages,
  chatMessages,
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type ProjectTask,
  type InsertProjectTask,
  type ProjectComment,
  type InsertProjectComment,
  type ProjectFile,
  type InsertProjectFile,
  type ContactMessage,
  type InsertContactMessage,
  type ChatMessage,
  type InsertChatMessage,
  type UpdateUserProfile
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Расширенный интерфейс хранилища для работы с пользователями и их проектами
export interface IStorage {
  // Пользователи
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User>;
  updateUserPassword(username: string, password: string): Promise<boolean>;
  getUsers(): Promise<User[]>; // Получение всех пользователей (для админа)

  // Проекты
  getProject(id: number): Promise<Project | undefined>;
  getUserProjects(userId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project>;
  getAllProjects(): Promise<Project[]>; // Получение всех проектов (для админа)

  // Задачи проекта
  getProjectTasks(projectId: number): Promise<ProjectTask[]>;
  createProjectTask(task: InsertProjectTask): Promise<ProjectTask>;
  updateProjectTask(id: number, task: Partial<InsertProjectTask>): Promise<ProjectTask>;

  // Комментарии к проекту
  getProjectComments(projectId: number): Promise<ProjectComment[]>;
  createProjectComment(comment: InsertProjectComment): Promise<ProjectComment>;

  // Файлы проекта
  getProjectFiles(projectId: number): Promise<ProjectFile[]>;
  createProjectFile(file: InsertProjectFile): Promise<ProjectFile>;

  // Контактные сообщения
  createMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getMessages(): Promise<ContactMessage[]>;
  getMessage(id: number): Promise<ContactMessage | undefined>;
  updateMessageStatus(id: number, isRead: boolean): Promise<ContactMessage>; // Обновление статуса сообщения

  // Чат между администратором и клиентом
  getChatMessages(projectId: number, userId: number, recipientId: number): Promise<ChatMessage[]>;
  getChatMessagesForUser(userId: number): Promise<ChatMessage[]>;
  getUnreadChatMessagesCount(userId: number): Promise<number>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markChatMessageAsRead(id: number): Promise<ChatMessage>;

  // Хранилище сессий для аутентификации
  sessionStore: session.Store;
}

// Реализация интерфейса хранилища с использованием базы данных PostgreSQL
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresSessionStore = connectPg(session);

    this.sessionStore = new PostgresSessionStore({ 
      pool: db.$client,
      createTableIfMissing: true 
    });
  }

  // Пользователи
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserProfile(id: number, profile: UpdateUserProfile): Promise<User> {
    const [user] = await db
      .update(users)
      .set(profile)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async updateUserPassword(username: string, password: string): Promise<boolean> {
    try {
      const [user] = await db
        .update(users)
        .set({ password })
        .where(eq(users.username, username))
        .returning({ id: users.id });

      return !!user;
    } catch (error) {
      console.error("Ошибка при обновлении пароля:", error);
      return false;
    }
  }

  // Проекты
  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getUserProjects(userId: number): Promise<Project[]> {
    return db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [createdProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return createdProject;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({
        ...project,
        updatedAt: new Date()
      })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  // Задачи проекта
  async getProjectTasks(projectId: number): Promise<ProjectTask[]> {
    return db
      .select()
      .from(projectTasks)
      .where(eq(projectTasks.projectId, projectId))
      .orderBy(desc(projectTasks.createdAt));
  }

  async createProjectTask(taskData: InsertProjectTask) {
    console.log("=== Storage: createProjectTask ===");
    console.log("Исходные данные задачи:", taskData);
    console.log("Тип deadline до обработки:", typeof taskData.deadline);
    console.log("Значение deadline до обработки:", taskData.deadline);

    // Преобразуем дату из формата DD.MM.YYYY в YYYY-MM-DD
    let deadline = null;
    if (taskData.deadline && typeof taskData.deadline === 'string') {
      console.log("Начинаем парсинг даты:", taskData.deadline);
      
      try {
        const [day, month, year] = taskData.deadline.split('.');
        if (day && month && year) {
          const dateStr = `${year}-${month}-${day}`;
          console.log("Преобразованная строка даты:", dateStr);
          deadline = new Date(dateStr);
          console.log("Результат преобразования в Date:", deadline);
          console.log("Валидная дата:", !isNaN(deadline.getTime()));
        }
      } catch (error) {
        console.error("Ошибка при парсинге даты:", error);
      }
    }

    const processedTask = {
      ...taskData,
      deadline: deadline
    };

    console.log("Обработанные данные задачи:", processedTask);
    console.log("Тип deadline после обработки:", typeof processedTask.deadline);
    console.log("Значение deadline после обработки:", processedTask.deadline);

    try {
      const result = await db.insert(projectTasks).values(processedTask).returning();
      console.log("Задача успешно создана:", result);
      return result;
    } catch (error) {
      console.error("Ошибка при создании задачи в БД:", error);
      throw error;
    }
  }

  async updateProjectTask(id: number, task: Partial<InsertProjectTask>): Promise<ProjectTask> {
    const [updatedTask] = await db
      .update(projectTasks)
      .set(task)
      .where(eq(projectTasks.id, id))
      .returning();
    return updatedTask;
  }

  // Комментарии к проекту
  async getProjectComments(projectId: number): Promise<ProjectComment[]> {
    return db
      .select()
      .from(projectComments)
      .where(eq(projectComments.projectId, projectId))
      .orderBy(desc(projectComments.createdAt));
  }

  async createProjectComment(comment: InsertProjectComment): Promise<ProjectComment> {
    const [createdComment] = await db
      .insert(projectComments)
      .values(comment)
      .returning();
    return createdComment;
  }

  // Файлы проекта
  async getProjectFiles(projectId: number): Promise<ProjectFile[]> {
    return db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.projectId, projectId))
      .orderBy(desc(projectFiles.uploadedAt));
  }

  async getProjectFile(fileId: number): Promise<ProjectFile | undefined> {
    const [file] = await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.id, fileId));
    return file;
  }

  async createProjectFile(file: InsertProjectFile): Promise<ProjectFile> {
    const [createdFile] = await db
      .insert(projectFiles)
      .values(file)
      .returning();
    return createdFile;
  }

  // Контактные сообщения
  async createMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [createdMessage] = await db
      .insert(contactMessages)
      .values(message)
      .returning();
    return createdMessage;
  }

  async getMessages(): Promise<ContactMessage[]> {
    return db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
  }

  async getMessage(id: number): Promise<ContactMessage | undefined> {
    const [message] = await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.id, id));
    return message;
  }

  async updateMessageStatus(id: number, isRead: boolean): Promise<ContactMessage> {
    const [updatedMessage] = await db
      .update(contactMessages)
      .set({ isRead })
      .where(eq(contactMessages.id, id))
      .returning();
    return updatedMessage;
  }

  // Административные методы
  async getUsers(): Promise<User[]> {
    return db
      .select()
      .from(users)
      .orderBy(users.username);
  }

  async getAllProjects(): Promise<Project[]> {
    return db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));
  }

  // Методы для работы с чатом

  async getChatMessages(projectId: number, userId: number, recipientId: number): Promise<ChatMessage[]> {
    // Получаем сообщения из переписки двух пользователей
    // Если projectId = 0, то это прямой чат без привязки к проекту (для админов)

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

    // Для прямого общения или в рамках проекта
    return db
      .select()
      .from(chatMessages)
      .where(
        projectId === 0
          ? conditions // Для прямого общения - только проверяем пользователей
          : and(
              eq(chatMessages.projectId, projectId),
              conditions // Для чата в проекте - проверяем и проект, и пользователей
            )
      )
      .orderBy(chatMessages.createdAt);
  }

  async getChatMessagesForUser(userId: number): Promise<ChatMessage[]> {
    // Получаем все сообщения пользователя (где он отправитель или получатель)
    return db
      .select()
      .from(chatMessages)
      .where(
        or(
          eq(chatMessages.userId, userId),
          eq(chatMessages.recipientId, userId)
        )
      )
      .orderBy(desc(chatMessages.createdAt));
  }

  async getUnreadChatMessagesCount(userId: number): Promise<number> {
    // Получаем количество непрочитанных сообщений для пользователя
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.recipientId, userId),
          eq(chatMessages.isRead, false)
        )
      );

    return result[0]?.count || 0;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    // Создаем новое сообщение в чате
    const [createdMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();

    return createdMessage;
  }

  async markChatMessageAsRead(id: number): Promise<ChatMessage> {
    // Отмечаем сообщение как прочитанное
    const [updatedMessage] = await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(eq(chatMessages.id, id))
      .returning();

    return updatedMessage;
  }
}

// Экспортируем экземпляр класса для использования в приложении
export const storage = new DatabaseStorage();