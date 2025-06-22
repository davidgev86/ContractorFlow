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
  trialStart: timestamp("trial_start"),
  subscriptionActive: boolean("subscription_active").default(false),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Projects table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
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
  priority: varchar("priority").default("medium"), // "low", "medium", "high"
  dueDate: timestamp("due_date"),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users);
export const insertProjectSchema = createInsertSchema(projects);
export const insertClientSchema = createInsertSchema(clients);
export const insertTaskSchema = createInsertSchema(tasks);
export const insertBudgetItemSchema = createInsertSchema(budgetItems);

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
