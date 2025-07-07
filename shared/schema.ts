/**
 * Database Schema Definition
 * 
 * This file contains the complete database schema for ContractorFlow,
 * including all tables, relations, and TypeScript types.
 * 
 * Key Features:
 * - PostgreSQL tables with Drizzle ORM
 * - Type-safe database operations
 * - Zod validation schemas
 * - Comprehensive relations between entities
 * - Support for user auth, projects, clients, tasks, billing, and file management
 */

import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
  decimal,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth with contractor extensions
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  
  // Subscription fields
  planType: varchar("plan_type").default("trial"), // "trial", "core", "pro"
  setupPaid: boolean("setup_paid").default(false),
  trialStart: timestamp("trial_start").defaultNow(),
  subscriptionActive: boolean("subscription_active").default(false),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  
  // QuickBooks integration fields
  quickbooksConnected: boolean("quickbooks_connected").default(false),
  quickbooksCompanyId: varchar("quickbooks_company_id"),
  quickbooksAccessToken: text("quickbooks_access_token"),
  quickbooksRefreshToken: text("quickbooks_refresh_token"),
  quickbooksTokenExpiry: timestamp("quickbooks_token_expiry"),
  quickbooksRealmId: varchar("quickbooks_realm_id"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  siteAddress: text("site_address"), // Job site address
  clientId: integer("client_id").notNull(),
  userId: varchar("user_id").notNull(),
  status: varchar("status").default("planning"), // "planning", "in_progress", "completed", "on_hold"
  budget: decimal("budget", { precision: 10, scale: 2 }),
  spent: decimal("spent", { precision: 10, scale: 2 }).default("0"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  dueDate: date("due_date"),
  progress: integer("progress").default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email"),
  phone: varchar("phone"),
  address: text("address"),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  projectId: integer("project_id").notNull(),
  userId: varchar("user_id").notNull(),
  assignedTo: varchar("assigned_to"),
  status: varchar("status").default("pending"), // "pending", "in_progress", "completed"
  priority: varchar("priority").default("medium"), // "low", "medium", "high", "urgent"
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  dueDate: timestamp("due_date"),
  startDate: timestamp("start_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Budget items table
export const budgetItems = pgTable("budget_items", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  userId: varchar("user_id").notNull(),
  category: varchar("category").notNull(), // "materials", "labor", "equipment", "other"
  description: varchar("description", { length: 255 }).notNull(),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
  quantity: integer("quantity").default(1),
  unit: varchar("unit"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client portal tables
export const clientPortalUsers = pgTable("client_portal_users", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "cascade" }),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  resetToken: varchar("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectUpdates = pgTable("project_updates", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  isVisibleToClient: boolean("is_visible_to_client").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const updateRequests = pgTable("update_requests", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  clientId: integer("client_id").references(() => clients.id, { onDelete: "cascade" }),
  requestedBy: varchar("requested_by").notNull(), // client email
  title: varchar("title").notNull(),
  description: text("description"),
  status: varchar("status").default("pending"), // pending, reviewed, completed
  contractorReply: text("contractor_reply"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectPhotos = pgTable("project_photos", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  updateId: integer("update_id").references(() => projectUpdates.id, { onDelete: "cascade" }),
  fileName: varchar("file_name").notNull(),
  originalName: varchar("original_name").notNull(),
  caption: text("caption"),
  isVisibleToClient: boolean("is_visible_to_client").default(true),
  uploadedBy: varchar("uploaded_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Progress billing milestones with QuickBooks integration
export const progressBillingMilestones = pgTable("progress_billing_milestones", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  percentage: integer("percentage").notNull(), // 0-100
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, in_progress, completed, invoiced, paid
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  
  // QuickBooks integration fields
  quickbooksInvoiceId: varchar("quickbooks_invoice_id", { length: 255 }),
  quickbooksInvoiceNumber: varchar("quickbooks_invoice_number", { length: 100 }),
  quickbooksInvoiceStatus: varchar("quickbooks_invoice_status", { length: 50 }),
  quickbooksInvoiceAmount: decimal("quickbooks_invoice_amount", { precision: 10, scale: 2 }),
  
  // Photo documentation requirements
  requiresPhotos: boolean("requires_photos").notNull().default(true),
  minPhotosRequired: integer("min_photos_required").notNull().default(3),
  photoInstructions: text("photo_instructions"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Photos specifically linked to billing milestones
export const milestonePhotos = pgTable("milestone_photos", {
  id: serial("id").primaryKey(),
  milestoneId: integer("milestone_id").references(() => progressBillingMilestones.id, { onDelete: "cascade" }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  description: text("description"),
  capturedAt: timestamp("captured_at").notNull(),
  gpsLocation: varchar("gps_location", { length: 255 }), // For job site verification
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  clients: many(clients),
  tasks: many(tasks),
  budgetItems: many(budgetItems),
}));

export const projectRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
  tasks: many(tasks),
  budgetItems: many(budgetItems),
  progressBillingMilestones: many(progressBillingMilestones),
}));

export const clientRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  projects: many(projects),
}));

export const taskRelations = relations(tasks, ({ one }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
}));

export const budgetItemRelations = relations(budgetItems, ({ one }) => ({
  user: one(users, { fields: [budgetItems.userId], references: [users.id] }),
  project: one(projects, { fields: [budgetItems.projectId], references: [projects.id] }),
}));

export const progressBillingMilestoneRelations = relations(progressBillingMilestones, ({ one, many }) => ({
  project: one(projects, { fields: [progressBillingMilestones.projectId], references: [projects.id] }),
  user: one(users, { fields: [progressBillingMilestones.userId], references: [users.id] }),
  photos: many(milestonePhotos),
}));

export const milestonePhotoRelations = relations(milestonePhotos, ({ one }) => ({
  milestone: one(progressBillingMilestones, { fields: [milestonePhotos.milestoneId], references: [progressBillingMilestones.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
}).extend({
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
});
export const insertBudgetItemSchema = createInsertSchema(budgetItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertBudgetItem = z.infer<typeof insertBudgetItemSchema>;
export type BudgetItem = typeof budgetItems.$inferSelect;

export const insertClientPortalUserSchema = createInsertSchema(clientPortalUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

export const insertProjectUpdateSchema = createInsertSchema(projectUpdates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectPhotoSchema = createInsertSchema(projectPhotos).omit({
  id: true,
  createdAt: true,
});

export const insertUpdateRequestSchema = createInsertSchema(updateRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProgressBillingMilestoneSchema = createInsertSchema(progressBillingMilestones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dueDate: z.string().optional(),
  amount: z.string(),
});

export const insertMilestonePhotoSchema = createInsertSchema(milestonePhotos).omit({
  id: true,
  createdAt: true,
}).extend({
  capturedAt: z.string(),
});

export type ClientPortalUser = typeof clientPortalUsers.$inferSelect;
export type InsertClientPortalUser = z.infer<typeof insertClientPortalUserSchema>;
export type ProjectUpdate = typeof projectUpdates.$inferSelect;
export type InsertProjectUpdate = z.infer<typeof insertProjectUpdateSchema>;
export type ProjectPhoto = typeof projectPhotos.$inferSelect;
export type InsertProjectPhoto = z.infer<typeof insertProjectPhotoSchema>;
export type UpdateRequest = typeof updateRequests.$inferSelect;
export type InsertUpdateRequest = z.infer<typeof insertUpdateRequestSchema>;
export type ProgressBillingMilestone = typeof progressBillingMilestones.$inferSelect;
export type InsertProgressBillingMilestone = z.infer<typeof insertProgressBillingMilestoneSchema>;
export type MilestonePhoto = typeof milestonePhotos.$inferSelect;
export type InsertMilestonePhoto = z.infer<typeof insertMilestonePhotoSchema>;
