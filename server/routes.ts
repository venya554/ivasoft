import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertAdminUserSchema, updateAdminUserSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Admin user stats
  app.get('/api/admin/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getAdminUserStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Get admin users with pagination, search, and filtering
  app.get('/api/admin/users', isAuthenticated, async (req, res) => {
    try {
      const {
        search,
        status,
        page = '1',
        limit = '10',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const result = await storage.getAdminUsers({
        search: search as string,
        status: status as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      res.json(result);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get single admin user
  app.get('/api/admin/users/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getAdminUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching admin user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Create admin user
  app.post('/api/admin/users', isAuthenticated, async (req, res) => {
    try {
      const validation = insertAdminUserSchema.safeParse(req.body);
      
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: errorMessage.toString() 
        });
      }

      const user = await storage.createAdminUser(validation.data);
      res.status(201).json(user);
    } catch (error: any) {
      console.error("Error creating admin user:", error);
      
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ 
          message: "User with this username or email already exists" 
        });
      }
      
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Update admin user
  app.put('/api/admin/users/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = updateAdminUserSchema.safeParse(req.body);
      
      if (!validation.success) {
        const errorMessage = fromZodError(validation.error);
        return res.status(400).json({ 
          message: "Validation error", 
          errors: errorMessage.toString() 
        });
      }

      const user = await storage.updateAdminUser(id, validation.data);
      res.json(user);
    } catch (error: any) {
      console.error("Error updating admin user:", error);
      
      if (error.message === "User not found") {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ 
          message: "User with this username or email already exists" 
        });
      }
      
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete admin user
  app.delete('/api/admin/users/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if user exists first
      const existingUser = await storage.getAdminUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      await storage.deleteAdminUser(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting admin user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}