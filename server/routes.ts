import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { db } from "./db";
import { projectUpdates, projectPhotos, updateRequests } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { insertProjectSchema, insertClientSchema, insertTaskSchema, insertBudgetItemSchema } from "@shared/schema";
import { z } from "zod";

if (!process.env.STRIPE_SECRET_KEY && !process.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn("Warning: Stripe keys not found. Subscription features will be disabled.");
}

let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16" as any,
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check trial status
      const now = new Date();
      const trialStart = user.trialStart ? new Date(user.trialStart) : now;
      const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000);
      const isTrialActive = now <= trialEnd;
      const trialDaysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

      res.json({
        ...user,
        isTrialActive,
        trialDaysRemaining,
        canAccessApp: user.subscriptionActive || isTrialActive,
        isPro: user.planType === "pro" && (user.subscriptionActive || isTrialActive),
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Project routes
  app.get("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertProjectSchema.parse({ ...req.body, userId });
      const project = await storage.createProject(validatedData);
      res.json(project);
    } catch (error: any) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: error.message || "Failed to create project" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id, userId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.put("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const project = await storage.updateProject(id, userId, req.body);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      await storage.deleteProject(id, userId);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Client routes
  app.get("/api/clients", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const clients = await storage.getClients(userId);
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertClientSchema.parse({ ...req.body, userId });
      const client = await storage.createClient(validatedData);
      res.json(client);
    } catch (error: any) {
      console.error("Error creating client:", error);
      res.status(400).json({ message: error.message || "Failed to create client" });
    }
  });

  // Task routes
  app.get("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const tasks = await storage.getTasks(userId, projectId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertTaskSchema.parse({ ...req.body, userId });
      const task = await storage.createTask(validatedData);
      res.json(task);
    } catch (error: any) {
      console.error("Error creating task:", error);
      res.status(400).json({ message: error.message || "Failed to create task" });
    }
  });

  app.put("/api/tasks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      const task = await storage.updateTask(id, userId, req.body);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Budget routes
  app.get("/api/budget", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const budgetItems = await storage.getBudgetItems(userId, projectId);
      res.json(budgetItems);
    } catch (error) {
      console.error("Error fetching budget items:", error);
      res.status(500).json({ message: "Failed to fetch budget items" });
    }
  });

  app.post("/api/budget", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertBudgetItemSchema.parse({ ...req.body, userId });
      const budgetItem = await storage.createBudgetItem(validatedData);
      res.json(budgetItem);
    } catch (error: any) {
      console.error("Error creating budget item:", error);
      res.status(400).json({ message: error.message || "Failed to create budget item" });
    }
  });

  // Stripe subscription routes (if Stripe is configured)
  if (stripe) {
    app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        
        if (!user || !user.email) {
          return res.status(400).json({ message: "User email required" });
        }

        const { planType, includeOnboarding } = req.body;
        
        if (!['core', 'pro'].includes(planType)) {
          return res.status(400).json({ message: "Invalid plan type" });
        }

        let customer;
        if (user.stripeCustomerId) {
          customer = await stripe.customers.retrieve(user.stripeCustomerId);
        } else {
          customer = await stripe.customers.create({
            email: user.email,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          });
          
          await storage.updateUserSubscription(userId, {
            stripeCustomerId: customer.id,
          });
        }

        // Create subscription items
        const lineItems = [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `ContractorFlow ${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
              },
              unit_amount: planType === 'core' ? 2500 : 3500, // $25 or $35
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Setup Fee',
              },
              unit_amount: 19900, // $199
            },
            quantity: 1,
          },
        ];

        if (includeOnboarding) {
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Concierge Onboarding',
              },
              unit_amount: 20000, // $200
            },
            quantity: 1,
          });
        }

        const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: lineItems as any,
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });

        await storage.updateUserSubscription(userId, {
          stripeSubscriptionId: subscription.id,
          planType,
        });

        const invoice = subscription.latest_invoice as Stripe.Invoice;
        const paymentIntent = (invoice as any).payment_intent as Stripe.PaymentIntent;

        res.json({
          subscriptionId: subscription.id,
          clientSecret: paymentIntent.client_secret,
        });
      } catch (error: any) {
        console.error("Error creating subscription:", error);
        res.status(400).json({ message: error.message || "Failed to create subscription" });
      }
    });

    // Webhook to handle subscription updates
    app.post('/api/webhooks/stripe', async (req, res) => {
      try {
        const event = req.body;
        
        switch (event.type) {
          case 'invoice.payment_succeeded':
            const invoice = event.data.object;
            if (invoice.subscription) {
              const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
              const customer = await stripe.customers.retrieve(subscription.customer as string);
              
              // Update user subscription status
              const user = await storage.getUser(customer.id);
              if (user) {
                await storage.updateUserSubscription(user.id, {
                  subscriptionActive: true,
                  setupPaid: true,
                });
              }
            }
            break;
            
          case 'subscription.deleted':
            const deletedSubscription = event.data.object;
            const deletedCustomer = await stripe.customers.retrieve(deletedSubscription.customer);
            
            const deletedUser = await storage.getUser(deletedCustomer.id);
            if (deletedUser) {
              await storage.updateUserSubscription(deletedUser.id, {
                subscriptionActive: false,
              });
            }
            break;
        }
        
        res.json({ received: true });
      } catch (error) {
        console.error("Webhook error:", error);
        res.status(400).json({ message: "Webhook failed" });
      }
    });
  }

  // Client portal middleware
  const verifyClientPortalToken = async (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
      const clientUser = await storage.getClientPortalUser(decoded.email);
      
      if (!clientUser || !clientUser.isActive) {
        return res.status(401).json({ message: "Invalid or inactive account" });
      }

      req.clientUser = clientUser;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };

  // Client portal authentication
  app.post('/api/client-portal/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const clientUser = await storage.getClientPortalUser(email);
      if (!clientUser || !clientUser.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, clientUser.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      await storage.updateClientPortalUserLogin(clientUser.id);

      const token = jwt.sign(
        { id: clientUser.id, email: clientUser.email },
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '7d' }
      );

      res.json({ 
        success: true, 
        token,
        user: {
          id: clientUser.id,
          email: clientUser.email,
          clientId: clientUser.clientId
        }
      });
    } catch (error) {
      console.error("Client portal login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Client portal profile
  app.get('/api/client-portal/profile', verifyClientPortalToken, async (req: any, res) => {
    try {
      const client = await storage.getClient(req.clientUser.clientId, '');
      res.json({
        name: client?.name,
        email: client?.email,
        phone: client?.phone
      });
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Client portal projects
  app.get('/api/client-portal/projects', verifyClientPortalToken, async (req: any, res) => {
    try {
      const projects = await storage.getClientProjects(req.clientUser.clientId);
      res.json(projects);
    } catch (error) {
      console.error("Projects fetch error:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Client portal updates
  app.get('/api/client-portal/updates', verifyClientPortalToken, async (req: any, res) => {
    try {
      const projects = await storage.getClientProjects(req.clientUser.clientId);
      const allUpdates = [];

      for (const project of projects) {
        const updates = await storage.getProjectUpdatesForClient(project.id);
        const updatesWithProject = updates.map(update => ({
          ...update,
          projectName: project.name,
          photos: update.photos || []
        }));
        allUpdates.push(...updatesWithProject);
      }

      allUpdates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json(allUpdates);
    } catch (error) {
      console.error("Updates fetch error:", error);
      res.status(500).json({ message: "Failed to fetch updates" });
    }
  });

  // Project updates endpoints
  app.get('/api/project-updates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getProjects(userId);
      const allUpdates = [];

      for (const project of projects) {
        // Get all updates for contractor view (not just client-visible)
        const updates = await db
          .select()
          .from(projectUpdates)
          .where(eq(projectUpdates.projectId, project.id))
          .orderBy(desc(projectUpdates.createdAt));

        // Get photos for each update
        const updatesWithPhotos = await Promise.all(
          updates.map(async (update) => {
            const photos = await db
              .select()
              .from(projectPhotos)
              .where(eq(projectPhotos.updateId, update.id));
            
            return {
              ...update,
              projectName: project.name,
              photos: photos || []
            };
          })
        );

        allUpdates.push(...updatesWithPhotos);
      }

      allUpdates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(allUpdates);
    } catch (error) {
      console.error("Updates fetch error:", error);
      res.status(500).json({ message: "Failed to fetch updates" });
    }
  });

  app.post('/api/project-updates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { projectId, title, description, isVisibleToClient } = req.body;

      const update = await storage.createProjectUpdate({
        projectId: parseInt(projectId),
        userId,
        title,
        description,
        isVisibleToClient: isVisibleToClient ?? true
      });

      res.json(update);
    } catch (error) {
      console.error("Update creation error:", error);
      res.status(500).json({ message: "Failed to create update" });
    }
  });

  // Photo upload endpoint with proper multipart handling
  app.post('/api/project-updates/photos', isAuthenticated, async (req: any, res) => {
    try {
      // For this demo, we'll create a mock photo record
      // In production, you'd use multer or similar for file upload
      const { updateId, caption, fileName } = req.body;
      
      if (updateId) {
        // Get the project ID from the update
        const [update] = await db
          .select()
          .from(projectUpdates)
          .where(eq(projectUpdates.id, parseInt(updateId)))
          .limit(1);

        if (update) {
          await storage.createProjectPhoto({
            projectId: update.projectId,
            updateId: parseInt(updateId),
            fileName: fileName || `photo-${Date.now()}.jpg`,
            originalName: "uploaded-photo.jpg",
            caption: caption || "Progress photo",
            isVisibleToClient: true,
            uploadedBy: req.user.claims.sub
          });
        }
      }
      
      res.json({ success: true, message: "Photo uploaded successfully" });
    } catch (error) {
      console.error("Photo upload error:", error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  // Serve photo files (mock endpoint)
  app.get('/api/project-updates/photos/:fileName', (req, res) => {
    // For demo purposes, return a placeholder image URL
    // In production, this would serve actual uploaded files
    res.redirect('https://via.placeholder.com/400x400/3B82F6/FFFFFF?text=Progress+Photo');
  });

  // Create client portal user (for contractors to add clients)
  app.post('/api/client-portal/create-user', isAuthenticated, async (req: any, res) => {
    try {
      const { clientId, email, password } = req.body;
      
      const existingUser = await storage.getClientPortalUser(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      
      const clientUser = await storage.createClientPortalUser({
        clientId,
        email,
        passwordHash,
        isActive: true
      });

      res.json({ 
        success: true, 
        message: "Client portal user created",
        user: {
          id: clientUser.id,
          email: clientUser.email
        }
      });
    } catch (error) {
      console.error("Client user creation error:", error);
      res.status(500).json({ message: "Failed to create client user" });
    }
  });

  // Password reset request
  app.post('/api/client-portal/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const clientUser = await storage.getClientPortalUser(email);
      if (!clientUser || !clientUser.isActive) {
        return res.json({ message: "If an account with that email exists, a reset link has been sent." });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000);

      await storage.setPasswordResetToken(email, resetToken, resetTokenExpiry);

      console.log(`Password reset token for ${email}: ${resetToken}`);
      console.log(`Reset URL: ${req.protocol}://${req.get('host')}/client-portal/reset-password?token=${resetToken}`);

      res.json({ 
        message: "If an account with that email exists, a reset link has been sent.",
        resetToken: resetToken,
        resetUrl: `/client-portal/reset-password?token=${resetToken}`
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Password reset confirmation
  app.post('/api/client-portal/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      const clientUser = await storage.getClientByResetToken(token);
      if (!clientUser) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateClientPassword(clientUser.id, passwordHash);
      await storage.clearResetToken(clientUser.id);

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Client portal - create update request
  app.post('/api/client-portal/request-update', verifyClientPortalToken, async (req: any, res) => {
    try {
      const { projectId, title, description } = req.body;
      
      if (!projectId || !title) {
        return res.status(400).json({ message: "Project ID and title are required" });
      }

      const updateRequest = await storage.createUpdateRequest({
        projectId: parseInt(projectId),
        clientId: req.clientUser.clientId,
        requestedBy: req.clientUser.email,
        title,
        description: description || "",
        status: "pending"
      });

      res.json(updateRequest);
    } catch (error) {
      console.error("Update request creation error:", error);
      res.status(500).json({ message: "Failed to create update request" });
    }
  });

  // Client portal - get update requests for client
  app.get('/api/client-portal/update-requests', verifyClientPortalToken, async (req: any, res) => {
    try {
      const requests = await storage.getUpdateRequestsForClient(req.clientUser.clientId);
      res.json(requests);
    } catch (error) {
      console.error("Update requests fetch error:", error);
      res.status(500).json({ message: "Failed to fetch update requests" });
    }
  });

  // Contractor - get update requests
  app.get('/api/update-requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getUpdateRequestsForContractor(userId);
      res.json(requests);
    } catch (error) {
      console.error("Update requests fetch error:", error);
      res.status(500).json({ message: "Failed to fetch update requests" });
    }
  });

  // Contractor - update request status
  app.put('/api/update-requests/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      const id = parseInt(req.params.id);
      
      if (!['pending', 'reviewed', 'completed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      await storage.updateRequestStatus(id, status);
      res.json({ message: "Status updated successfully" });
    } catch (error) {
      console.error("Update request status error:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
