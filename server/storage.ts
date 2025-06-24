import {
  users,
  projects,
  clients,
  tasks,
  budgetItems,
  clientPortalUsers,
  projectUpdates,
  projectPhotos,
  updateRequests,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type Client,
  type InsertClient,
  type Task,
  type InsertTask,
  type BudgetItem,
  type InsertBudgetItem,
  type ClientPortalUser,
  type InsertClientPortalUser,
  type ProjectUpdate,
  type InsertProjectUpdate,
  type ProjectPhoto,
  type InsertProjectPhoto,
  type UpdateRequest,
  type InsertUpdateRequest,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserSubscription(id: string, data: {
    planType?: string;
    setupPaid?: boolean;
    subscriptionActive?: boolean;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }): Promise<User>;
  
  // Project operations
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: number, userId: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, userId: string, data: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number, userId: string): Promise<void>;
  
  // Client operations
  getClients(userId: string): Promise<Client[]>;
  getClient(id: number, userId: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, userId: string, data: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: number, userId: string): Promise<void>;
  
  // Task operations
  getTasks(userId: string, projectId?: number): Promise<Task[]>;
  getTask(id: number, userId: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, userId: string, data: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number, userId: string): Promise<void>;
  
  // Budget operations
  getBudgetItems(userId: string, projectId?: number): Promise<BudgetItem[]>;
  getBudgetItem(id: number, userId: string): Promise<BudgetItem | undefined>;
  createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem>;
  updateBudgetItem(id: number, userId: string, data: Partial<InsertBudgetItem>): Promise<BudgetItem>;
  deleteBudgetItem(id: number, userId: string): Promise<void>;
  
  // Dashboard stats
  getDashboardStats(userId: string): Promise<{
    activeProjects: number;
    dueThisWeek: number;
    revenueMTD: string;
    activeClients: number;
    monthlyTarget: string;
    profit: string;
    expenses: string;
  }>;

  // Client portal operations
  getClientPortalUser(email: string): Promise<ClientPortalUser | undefined>;
  createClientPortalUser(user: InsertClientPortalUser): Promise<ClientPortalUser>;
  updateClientPortalUserLogin(id: number): Promise<void>;
  getClientProjects(clientId: number): Promise<Project[]>;
  getProjectUpdatesForClient(projectId: number): Promise<ProjectUpdate[]>;
  createProjectUpdate(update: InsertProjectUpdate): Promise<ProjectUpdate>;
  createProjectPhoto(photo: InsertProjectPhoto): Promise<ProjectPhoto>;
  
  // Password reset operations
  setPasswordResetToken(email: string, token: string, expiry: Date): Promise<void>;
  getClientByResetToken(token: string): Promise<ClientPortalUser | undefined>;
  updateClientPassword(id: number, passwordHash: string): Promise<void>;
  clearResetToken(id: number): Promise<void>;
  
  // Update request operations
  createUpdateRequest(request: InsertUpdateRequest): Promise<UpdateRequest>;
  getUpdateRequestsForContractor(userId: string): Promise<UpdateRequest[]>;
  getUpdateRequestsForClient(clientId: number): Promise<UpdateRequest[]>;
  updateRequestStatus(id: number, status: string): Promise<void>;
  updateRequestReply(id: number, reply: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserSubscription(id: string, data: {
    planType?: string;
    setupPaid?: boolean;
    subscriptionActive?: boolean;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Project operations
  async getProjects(userId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt));
  }

  async getProject(id: number, userId: string): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return project;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }

  async updateProject(id: number, userId: string, data: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();
    return project;
  }

  async deleteProject(id: number, userId: string): Promise<void> {
    await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
  }

  // Client operations
  async getClients(userId: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(eq(clients.userId, userId))
      .orderBy(desc(clients.updatedAt));
  }

  async getClient(id: number, userId: string): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db
      .insert(clients)
      .values(client)
      .returning();
    return newClient;
  }

  async updateClient(id: number, userId: string, data: Partial<InsertClient>): Promise<Client> {
    const [client] = await db
      .update(clients)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(clients.id, id), eq(clients.userId, userId)))
      .returning();
    return client;
  }

  async deleteClient(id: number, userId: string): Promise<void> {
    await db
      .delete(clients)
      .where(and(eq(clients.id, id), eq(clients.userId, userId)));
  }

  // Task operations
  async getTasks(userId: string, projectId?: number): Promise<Task[]> {
    const conditions = [eq(tasks.userId, userId)];
    if (projectId) {
      conditions.push(eq(tasks.projectId, projectId));
    }

    return await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));
  }

  async getTask(id: number, userId: string): Promise<Task | undefined> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values(task)
      .returning();
    return newTask;
  }

  async updateTask(id: number, userId: string, data: Partial<InsertTask>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return task;
  }

  async deleteTask(id: number, userId: string): Promise<void> {
    await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  }

  // Budget operations
  async getBudgetItems(userId: string, projectId?: number): Promise<BudgetItem[]> {
    const conditions = [eq(budgetItems.userId, userId)];
    if (projectId) {
      conditions.push(eq(budgetItems.projectId, projectId));
    }

    return await db
      .select()
      .from(budgetItems)
      .where(and(...conditions))
      .orderBy(desc(budgetItems.createdAt));
  }

  async getBudgetItem(id: number, userId: string): Promise<BudgetItem | undefined> {
    const [item] = await db
      .select()
      .from(budgetItems)
      .where(and(eq(budgetItems.id, id), eq(budgetItems.userId, userId)));
    return item;
  }

  async createBudgetItem(item: InsertBudgetItem): Promise<BudgetItem> {
    const [newItem] = await db
      .insert(budgetItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateBudgetItem(id: number, userId: string, data: Partial<InsertBudgetItem>): Promise<BudgetItem> {
    const [item] = await db
      .update(budgetItems)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(budgetItems.id, id), eq(budgetItems.userId, userId)))
      .returning();
    return item;
  }

  async deleteBudgetItem(id: number, userId: string): Promise<void> {
    await db
      .delete(budgetItems)
      .where(and(eq(budgetItems.id, id), eq(budgetItems.userId, userId)));
  }

  // Dashboard stats
  async getDashboardStats(userId: string): Promise<{
    activeProjects: string;
    dueThisWeek: string;
    revenueMTD: string;
    activeClients: string;
    monthlyTarget: string;
    profit: string;
    expenses: string;
  }> {
    // Active projects count (including planning and in_progress, excluding completed and on_hold)
    const [activeProjectsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(and(
        eq(projects.userId, userId), 
        sql`${projects.status} IN ('planning', 'in_progress')`
      ));

    // Due this week count
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    const [dueThisWeekResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(and(
        eq(tasks.userId, userId),
        sql`${tasks.dueDate} <= ${oneWeekFromNow.toISOString()}`,
        eq(tasks.status, "pending")
      ));

    // Active clients count
    const [activeClientsResult] = await db
      .select({ count: sql<number>`count(distinct ${clients.id})` })
      .from(clients)
      .innerJoin(projects, eq(projects.clientId, clients.id))
      .where(and(eq(clients.userId, userId), eq(projects.status, "in_progress")));

    // Revenue calculation (sum of project budgets for completed/in-progress projects this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [revenueResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(${projects.budget}), 0)` })
      .from(projects)
      .where(and(
        eq(projects.userId, userId),
        sql`${projects.updatedAt} >= ${startOfMonth.toISOString()}`,
        sql`${projects.status} IN ('in_progress', 'completed')`
      ));

    const revenue = parseFloat(revenueResult.total || "0");
    const monthlyTarget = 45000;
    const profit = revenue * 0.75;
    const expenses = revenue * 0.25;

    return {
      activeProjects: (activeProjectsResult.count || 0).toString(),
      dueThisWeek: (dueThisWeekResult.count || 0).toString(),
      revenueMTD: revenue >= 1000 ? `$${(revenue / 1000).toFixed(1)}k` : `$${revenue.toLocaleString()}`,
      activeClients: (activeClientsResult.count || 0).toString(),
      monthlyTarget: `$${(monthlyTarget / 1000).toFixed(0)}k`,
      profit: profit >= 1000 ? `$${(profit / 1000).toFixed(1)}k` : `$${Math.round(profit).toLocaleString()}`,
      expenses: expenses >= 1000 ? `$${(expenses / 1000).toFixed(1)}k` : `$${Math.round(expenses).toLocaleString()}`,
    };
  }

  // Client portal operations
  async getClientPortalUser(email: string): Promise<ClientPortalUser | undefined> {
    const [user] = await db
      .select()
      .from(clientPortalUsers)
      .where(eq(clientPortalUsers.email, email));
    return user;
  }

  async createClientPortalUser(userData: InsertClientPortalUser): Promise<ClientPortalUser> {
    const [user] = await db
      .insert(clientPortalUsers)
      .values(userData)
      .returning();
    return user;
  }

  async updateClientPortalUserLogin(id: number): Promise<void> {
    await db
      .update(clientPortalUsers)
      .set({ lastLogin: new Date() })
      .where(eq(clientPortalUsers.id, id));
  }

  async getClientProjects(clientId: number): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.clientId, clientId))
      .orderBy(desc(projects.createdAt));
  }

  async getProjectUpdatesForClient(projectId: number): Promise<ProjectUpdate[]> {
    const updates = await db
      .select()
      .from(projectUpdates)
      .where(and(
        eq(projectUpdates.projectId, projectId),
        eq(projectUpdates.isVisibleToClient, true)
      ))
      .orderBy(desc(projectUpdates.createdAt));

    // Get associated photos for each update
    const updatesWithPhotos = await Promise.all(
      updates.map(async (update) => {
        const photos = await db
          .select()
          .from(projectPhotos)
          .where(and(
            eq(projectPhotos.updateId, update.id),
            eq(projectPhotos.isVisibleToClient, true)
          ));
        
        return {
          ...update,
          photos: photos || []
        };
      })
    );

    return updatesWithPhotos;
  }

  async createProjectUpdate(updateData: InsertProjectUpdate): Promise<ProjectUpdate> {
    const [update] = await db
      .insert(projectUpdates)
      .values(updateData)
      .returning();
    return update;
  }

  async createProjectPhoto(photoData: InsertProjectPhoto): Promise<ProjectPhoto> {
    const [photo] = await db
      .insert(projectPhotos)
      .values(photoData)
      .returning();
    return photo;
  }

  // Password reset operations
  async setPasswordResetToken(email: string, token: string, expiry: Date): Promise<void> {
    await db
      .update(clientPortalUsers)
      .set({ 
        resetToken: token,
        resetTokenExpiry: expiry
      })
      .where(eq(clientPortalUsers.email, email));
  }

  async getClientByResetToken(token: string): Promise<ClientPortalUser | undefined> {
    const [user] = await db
      .select()
      .from(clientPortalUsers)
      .where(and(
        eq(clientPortalUsers.resetToken, token),
        sql`${clientPortalUsers.resetTokenExpiry} > NOW()`
      ));
    return user;
  }

  async updateClientPassword(id: number, passwordHash: string): Promise<void> {
    await db
      .update(clientPortalUsers)
      .set({ passwordHash })
      .where(eq(clientPortalUsers.id, id));
  }

  async clearResetToken(id: number): Promise<void> {
    await db
      .update(clientPortalUsers)
      .set({ 
        resetToken: null,
        resetTokenExpiry: null
      })
      .where(eq(clientPortalUsers.id, id));
  }

  // Update request operations
  async createUpdateRequest(requestData: InsertUpdateRequest): Promise<UpdateRequest> {
    const [request] = await db
      .insert(updateRequests)
      .values(requestData)
      .returning();
    return request;
  }

  async getUpdateRequestsForContractor(userId: string): Promise<UpdateRequest[]> {
    return await db
      .select({
        ...updateRequests,
        projectName: projects.name,
        clientName: clients.name,
      })
      .from(updateRequests)
      .innerJoin(projects, eq(updateRequests.projectId, projects.id))
      .innerJoin(clients, eq(updateRequests.clientId, clients.id))
      .where(eq(projects.userId, userId))
      .orderBy(desc(updateRequests.createdAt));
  }

  async getUpdateRequestsForClient(clientId: number): Promise<UpdateRequest[]> {
    return await db
      .select({
        ...updateRequests,
        projectName: projects.name,
      })
      .from(updateRequests)
      .innerJoin(projects, eq(updateRequests.projectId, projects.id))
      .where(eq(updateRequests.clientId, clientId))
      .orderBy(desc(updateRequests.createdAt));
  }

  async updateRequestStatus(id: number, status: string): Promise<void> {
    await db
      .update(updateRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(updateRequests.id, id));
  }
}

export const storage = new DatabaseStorage();
