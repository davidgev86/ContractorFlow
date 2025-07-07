# FieldContractorFlow

A comprehensive project management application built specifically for contractors. FieldContractorFlow streamlines project workflows, task scheduling, client communication, and business operations through an advanced project management portal.

## 🎯 Overview

FieldContractorFlow helps contractors manage their business more efficiently by providing:

- **Project Management**: Complete project lifecycle tracking with tasks, budgets, and timelines
- **Client Portal**: Dedicated client access for project updates and communication
- **Progress Billing**: Photo-backed milestone billing with QuickBooks integration
- **File Management**: Secure photo uploads and document sharing
- **Reporting**: Professional PDF reports and dashboard analytics
- **Integrations**: QuickBooks Online and Stripe payment processing

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Wouter** for lightweight client-side routing
- **Tailwind CSS** with shadcn/ui components for modern UI
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation

### Backend
- **Express.js** server with TypeScript
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** via Neon serverless database
- **Replit Authentication** using OpenID Connect
- **Stripe** for subscription management
- **QuickBooks** integration for accounting

### Development Tools
- **TypeScript** for type safety across the stack
- **ESBuild** for fast compilation
- **Drizzle Kit** for database migrations

## 📁 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and configurations
│   │   └── pages/          # Application pages/routes
├── server/                 # Backend Express application
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API route definitions
│   ├── storage.ts         # Data access layer
│   ├── replitAuth.ts      # Authentication setup
│   └── quickbooks.ts      # QuickBooks integration
├── shared/                 # Shared code between frontend and backend
│   └── schema.ts          # Database schema and types
└── uploads/               # File upload storage
```

## 🛠 Development Setup

1. **Prerequisites**
   - Node.js 20+
   - PostgreSQL database (Neon recommended)
   - Replit environment (for authentication)

2. **Environment Variables**
   ```env
   DATABASE_URL=your_neon_database_url
   SESSION_SECRET=your_session_secret
   STRIPE_SECRET_KEY=your_stripe_secret
   VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
   QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
   QUICKBOOKS_CLIENT_SECRET=your_quickbooks_secret
   ```

3. **Installation & Setup**
   ```bash
   npm install
   npm run db:push    # Push schema to database
   npm run dev        # Start development server
   ```

## 🗄 Database Schema

The application uses PostgreSQL with the following main entities:

- **Users**: Contractor accounts with subscription management
- **Clients**: Client information and portal access
- **Projects**: Project details, status, and progress tracking
- **Tasks**: Project-specific tasks with time tracking
- **Budget Items**: Project budget breakdown and cost tracking
- **Progress Billing Milestones**: Photo-backed billing milestones
- **Project Updates**: Client-visible project updates with photos

## 🔐 Authentication

### Contractor Authentication
- **Replit OAuth**: OpenID Connect integration for contractor accounts
- **Session Management**: PostgreSQL-backed sessions with secure cookies

### Client Portal Authentication
- **JWT-based**: Separate authentication system for clients
- **Password Reset**: Email-based password recovery
- **Account Setup**: Contractor-initiated client account creation

## 💳 Subscription Management

### Pricing Tiers
- **Trial**: 14-day free trial with full feature access
- **Core**: Essential features for individual contractors
- **Pro**: Advanced features including QuickBooks integration

### Features
- Stripe integration for secure payment processing
- Trial period tracking and automatic feature restriction
- Webhook handling for subscription lifecycle events

## 📊 Key Features

### Project Management
- Complete project CRUD operations
- Status tracking (planning, in_progress, completed, on_hold)
- Progress tracking with percentage completion
- Due date management and tracking
- Site address and project details

### Task Management
- Project-specific task creation and assignment
- Priority levels (low, medium, high, urgent)
- Status tracking (pending, in_progress, completed, blocked)
- Time estimation and actual hours tracking
- Start date and due date scheduling

### Client Portal
- Dedicated client dashboard
- Project progress viewing
- Update request submission
- Photo gallery access
- Real-time communication with contractors

### Progress Billing
- Photo-backed milestone creation
- QuickBooks invoice integration
- Status management (pending, in_progress, completed, paid)
- Client-facing payment justification
- Visual progress tracking

### File Management
- Secure image upload with validation
- File size and type restrictions (10MB, images only)
- Milestone photo documentation
- Project update photo attachments

### Reporting
- Professional PDF client reports
- Executive-style formatting with branding
- Comprehensive project information
- Progress visualization with bars
- Mobile-optimized viewing

### QuickBooks Integration
- OAuth 2.0 authentication
- Customer synchronization
- Project-to-estimate syncing
- Invoice creation and management
- Two-way data synchronization

## 🚀 Deployment

The application is designed for deployment on Replit with:

- **Auto-scaling**: Handles traffic spikes automatically
- **Environment Management**: Secure environment variable handling
- **Database**: Neon serverless PostgreSQL integration
- **File Storage**: Local file system with secure serving

## 🔧 API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout user

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Clients
- `GET /api/clients` - List user clients
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client

### Tasks
- `GET /api/tasks` - List tasks (optionally filtered by project)
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task

### Progress Billing
- `GET /api/progress-billing-milestones` - List milestones
- `POST /api/progress-billing-milestones` - Create milestone
- `POST /api/milestones/:id/photos` - Upload milestone photos

### Client Portal
- `POST /api/client-portal/login` - Client login
- `GET /api/client-portal/projects` - Client's projects
- `POST /api/client-portal/update-requests` - Submit update request

## 📝 Contributing

1. Follow TypeScript best practices
2. Use the established code style and patterns
3. Update documentation for any API changes
4. Ensure all tests pass before committing
5. Use descriptive commit messages

## 📄 License

This project is proprietary software developed for contractor management needs.

---

Built with ❤️ for contractors who want to focus on their craft, not paperwork.

Visit us at [fieldcontractorflow.com](https://fieldcontractorflow.com)