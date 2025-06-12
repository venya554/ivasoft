import { users, type AdminUser, type InsertAdminUser, type UpdateAdminUser, type LoginData } from "@shared/schema";
import bcrypt from "bcrypt";

export interface IStorage {
  // User authentication
  authenticateAdmin(email: string, password: string): Promise<AdminUser | null>;
  getUserById(id: number): Promise<AdminUser | undefined>;
  getUserByEmail(email: string): Promise<AdminUser | undefined>;
  getUserByUsername(username: string): Promise<AdminUser | undefined>;
  
  // Admin user management
  getUsers(options: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: AdminUser[]; total: number }>;
  createUser(user: InsertAdminUser): Promise<AdminUser>;
  updateUser(id: number, user: UpdateAdminUser): Promise<AdminUser>;
  deleteUser(id: number): Promise<void>;
  
  // Statistics
  getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsersThisWeek: number;
  }>;
  
  // Role management
  assignAdminRole(email: string): Promise<AdminUser | null>;
}

export class MemStorage implements IStorage {
  private users: Map<number, AdminUser>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    this.initializeDefaultAdmin();
  }

  private async initializeDefaultAdmin() {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const admin: AdminUser = {
      id: this.currentId++,
      name: "Администратор",
      username: "admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
      active: true,
      firstName: "Админ",
      lastName: "Системы",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(admin.id, admin);

    // Добавьте своего администратора здесь
    const myAdminPassword = await bcrypt.hash("123456", 10);
    const myAdmin: AdminUser = {
      id: this.currentId++,
      name: "Мой Администратор",
      username: "myadmin",
      email: "myadmin@example.com", // ← Замените на свой email
      password: myAdminPassword,
      role: "admin",
      active: true,
      firstName: "Мой",
      lastName: "Админ",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(myAdmin.id, myAdmin);

    // Add some sample users
    const sampleUsers = [
      {
        name: "Иван Петров",
        username: "ivan_petrov",
        email: "ivan@example.com",
        role: "user" as const,
        firstName: "Иван",
        lastName: "Петров",
      },
      {
        name: "Мария Сидорова",
        username: "maria_sidorova",
        email: "maria@example.com",
        role: "moderator" as const,
        firstName: "Мария",
        lastName: "Сидорова",
      },
      {
        name: "Алексей Иванов",
        username: "alex_ivanov",
        email: "alex@example.com",
        role: "user" as const,
        firstName: "Алексей",
        lastName: "Иванов",
      },
    ];

    for (const userData of sampleUsers) {
      const hashedPass = await bcrypt.hash("password123", 10);
      const user: AdminUser = {
        id: this.currentId++,
        ...userData,
        password: hashedPass,
        active: true,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
        updatedAt: new Date(),
      };
      this.users.set(user.id, user);
    }
  }

  async authenticateAdmin(email: string, password: string): Promise<AdminUser | null> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    if (!user || !user.active) return null;
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return null;
    
    // Only allow admin and moderator roles to access admin panel
    if (user.role !== "admin" && user.role !== "moderator") return null;
    
    return user;
  }

  async getUserById(id: number): Promise<AdminUser | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<AdminUser | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async getUserByUsername(username: string): Promise<AdminUser | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async getUsers(options: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: AdminUser[]; total: number }> {
    let filteredUsers = Array.from(this.users.values());

    // Apply search filter
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.username.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (options.status === "active") {
      filteredUsers = filteredUsers.filter(user => user.active);
    } else if (options.status === "inactive") {
      filteredUsers = filteredUsers.filter(user => !user.active);
    }

    const total = filteredUsers.length;

    // Apply pagination
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    return { users: paginatedUsers, total };
  }

  async createUser(user: InsertAdminUser): Promise<AdminUser> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser: AdminUser = {
      ...user,
      id: this.currentId++,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: UpdateAdminUser): Promise<AdminUser> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      throw new Error("Пользователь не найден");
    }

    const updatedUser: AdminUser = {
      ...existingUser,
      ...userData,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    if (!this.users.has(id)) {
      throw new Error("Пользователь не найден");
    }
    this.users.delete(id);
  }

  async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsersThisWeek: number;
  }> {
    const allUsers = Array.from(this.users.values());
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return {
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(user => user.active).length,
      newUsersThisWeek: allUsers.filter(user => 
        user.createdAt && user.createdAt >= oneWeekAgo
      ).length,
    };
  }

  async assignAdminRole(email: string): Promise<AdminUser | null> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    if (!user) return null;

    const updatedUser: AdminUser = {
      ...user,
      role: "admin",
      updatedAt: new Date(),
    };
    this.users.set(user.id, updatedUser);
    return updatedUser;
  }
}

export const storage = new MemStorage();