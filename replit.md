# replit.md

## Overview

ContractorFlow is a comprehensive project management application built specifically for contractors. It features a full-stack architecture with a React frontend, Express.js backend, and PostgreSQL database. The application includes subscription management, client portals, project updates, and file management capabilities.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript as the primary frontend framework
- **Vite** for build tooling and development server
- **React Router (wouter)** for client-side routing
- **Tailwind CSS** with shadcn/ui components for styling
- **React Query (TanStack Query)** for server state management
- **React Hook Form** with Zod validation for form handling
- **Stripe** integration for payment processing

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** architecture with organized route handlers
- **Replit Authentication** using OpenID Connect for user authentication
- **Session management** with express-session and PostgreSQL store
- **File upload** handling for project photos and documents
- **Stripe webhooks** for subscription management

### Database Architecture
- **PostgreSQL** as the primary database
- **Drizzle ORM** for type-safe database operations
- **Neon Database** as the serverless PostgreSQL provider
- Schema includes: users, projects, clients, tasks, budget items, project updates, client portal users, and sessions

## Key Components

### Authentication System
- Replit OAuth integration for contractor authentication
- Separate client portal authentication system with JWT tokens
- Session-based authentication for main app users
- Password hashing with bcrypt for client portal users

### Subscription Management
- Three-tier pricing: Trial (14 days), Core, and Pro plans
- Stripe integration for payment processing
- Trial period tracking and subscription status management
- Setup fee handling for onboarding services

### Project Management
- CRUD operations for projects, clients, and tasks
- Project status tracking (planning, in_progress, completed, on_hold)
- Advanced task scheduling with priority levels (low, medium, high, urgent)
- Task assignment with time estimation and tracking (estimatedHours, actualHours)
- Project-specific task management with due dates and start dates
- Integrated task management interface with tabbed navigation
- Task status tracking (pending, in_progress, completed, blocked)
- Budget management with line items
- File attachments for project updates
- Progress tracking and reporting

### Client Portal
- Separate authentication system for clients
- Project visibility controls
- Update request functionality
- Photo sharing and progress viewing
- Password reset functionality

### File Management
- Image upload for project updates
- File size and type validation
- Secure file serving through API endpoints

## Data Flow

1. **User Authentication**: Contractors authenticate via Replit OAuth, clients via separate JWT system
2. **Project Creation**: Contractors create projects and associate them with clients
3. **Task Management**: Tasks are created, assigned, and tracked within projects
4. **Client Updates**: Contractors post updates that can be visible to clients
5. **File Uploads**: Images and documents are uploaded and associated with project updates
6. **Subscription Flow**: Trial users upgrade through Stripe checkout integration

## External Dependencies

### Core Services
- **Replit Authentication**: OAuth provider for contractor accounts
- **Neon Database**: Serverless PostgreSQL hosting
- **Stripe**: Payment processing and subscription management

### Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type safety across the entire stack
- **Drizzle**: Database ORM and migration management

### UI Libraries
- **Radix UI**: Headless component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

## Deployment Strategy

### Development Environment
- Uses Vite development server with HMR
- Express server runs on port 5000
- PostgreSQL connection via Neon serverless
- Environment variables for API keys and database URLs

### Production Deployment
- Vite builds static assets to `dist/public`
- Express server serves both API and static files
- Database migrations handled via Drizzle
- Replit deployment with autoscale configuration

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Express session encryption key
- `STRIPE_SECRET_KEY` & `VITE_STRIPE_PUBLIC_KEY`: Stripe API keys
- `REPLIT_DOMAINS`: OAuth callback configuration
- `ISSUER_URL`: OpenID Connect issuer URL

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- June 24, 2025: Initial ContractorFlow setup with full-stack architecture
- June 24, 2025: Implemented comprehensive client portal with authentication, project viewing, and update requests
- June 24, 2025: Added contractor reply system for client requests with database integration
- June 24, 2025: Integrated client requests into projects page using tabbed interface with status management
- June 24, 2025: Fixed multiple runtime errors and implemented proper data handling for request management system
- June 26, 2025: Completed advanced task scheduling system with comprehensive project-specific task management
- June 26, 2025: Resolved dialog state conflicts and form validation issues for seamless task creation
- June 26, 2025: Enhanced database schema with task tracking fields (estimatedHours, actualHours, startDate, priority levels)
- June 26, 2025: Successfully implemented full task management interface in Projects tab with proper tab switching functionality
- June 27, 2025: Added interactive status controls for projects and tasks with dropdown interfaces
- June 27, 2025: Implemented real-time status updates for project statuses (planning, in_progress, completed, on_hold) and task statuses (pending, in_progress, completed, blocked)
- June 27, 2025: Completed comprehensive testing of all clickable elements across all pages - navigation, buttons, forms, and interactive components confirmed working properly
- June 27, 2025: Converted client reports from CSV to professional PDF format with executive styling, branded headers, visual progress bars, and comprehensive project details
- June 27, 2025: Enhanced PDF client reports with comprehensive branding including company tagline, contact information, professional disclaimers, and fixed header formatting issues
- July 1, 2025: Implemented comprehensive QuickBooks integration with OAuth authentication, two-way sync functionality, project-to-estimate syncing, client-to-customer syncing, and Pro plan restriction enforcement
- July 3, 2025: Built Photo-Backed Progress Billing system with milestone management, QuickBooks invoice integration, visual project progress tracking, and client-facing payment justification
- July 3, 2025: Completed interactive milestone status management with clickable status badges, dropdown menus for status changes (pending/in_progress/completed/paid), and real-time progress overview updates
- July 3, 2025: Implemented comprehensive photo upload system with multer file handling, image validation, drag & drop interface, photo deletion capability, and secure file serving for milestone documentation

## Changelog

- June 24, 2025: Initial setup and core functionality implementation
- July 1, 2025: QuickBooks Integration - Added full OAuth workflow, database schema updates, API endpoints, Settings page, and project sync functionality
- July 3, 2025: Progress Billing Feature - Complete milestone management system with photo documentation, QuickBooks invoice sync, and residential contractor-focused payment workflows