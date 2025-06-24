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

## Changelog

Changelog:
- June 24, 2025. Initial setup