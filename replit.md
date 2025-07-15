# Admin Panel Application

## Overview

This is a full-stack admin panel application built with React and Express.js. The application provides a comprehensive management interface for users, products, and events with CRUD operations, search functionality, and a clean dashboard interface.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Library**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **API Design**: RESTful API with JSON responses
- **Error Handling**: Centralized error handling middleware
- **Logging**: Custom request/response logging

### Data Layer
- **ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon Database)
- **Schema**: Strongly typed schema definitions with Zod validation
- **Storage**: Abstracted storage interface with in-memory implementation

## Key Components

### Database Schema
The application manages three core entities:
- **Users**: Authentication and role-based access with status management
- **Products**: Inventory management with pricing and categorization
- **Events**: Event scheduling with attendance tracking

### UI Components
- Comprehensive component library based on Radix UI
- Responsive design with mobile-first approach
- Dark/light theme support through CSS variables
- Reusable data table with search, pagination, and sorting

### API Structure
RESTful endpoints following standard conventions:
- `GET /api/{resource}` - List all items
- `GET /api/{resource}/:id` - Get specific item
- `POST /api/{resource}` - Create new item
- `PUT /api/{resource}/:id` - Update existing item
- `DELETE /api/{resource}/:id` - Delete item

## Data Flow

### Client-Server Communication
1. Client makes API requests through typed API functions
2. TanStack Query manages caching and synchronization
3. Express server handles requests with validation
4. Drizzle ORM translates to database operations
5. Responses are cached and updated in the client

### Form Handling
1. React Hook Form manages form state
2. Zod schemas provide runtime validation
3. API mutations update server state
4. Query cache invalidation triggers UI updates

### Authentication Flow
While not fully implemented, the architecture supports:
- Role-based access control (admin, moderator, user)
- User status management (active, inactive, pending)
- Protected routes and API endpoints

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Hook Form
- **TypeScript**: Full type safety across the stack
- **Express**: Server framework with middleware support
- **Drizzle**: Type-safe ORM with PostgreSQL support

### UI/UX Dependencies
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Consistent icon library
- **Date-fns**: Date manipulation utilities

### Development Tools
- **Vite**: Fast development server and build tool
- **TSX**: TypeScript execution for development
- **ESBuild**: Fast bundling for production builds

## Deployment Strategy

### Development Environment
- Vite development server with HMR
- Express server with request logging
- In-memory storage for rapid iteration
- Replit-specific development tools integration

### Production Build
- Vite builds optimized client bundle
- ESBuild bundles server code
- Static assets served by Express
- Environment-based configuration

### Database Migration
- Drizzle Kit handles schema migrations
- PostgreSQL connection via environment variables
- Schema versioning in dedicated migrations folder

## Changelog
- July 01, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.