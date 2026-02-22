# MavHousing

A full-stack university housing management platform built for students, staff, and administrators. Handles the full lifecycle of student housing — from applications and lease management to maintenance requests and payments.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Shadcn UI, Tailwind CSS |
| Backend | NestJS (monorepo with shared Prisma library) |
| Database | PostgreSQL + Prisma ORM |
| Auth | Custom JWT auth server with RBAC |
| Communication | REST APIs between frontend and internal API |

## Architecture

The project is a **Turborepo monorepo** with three independent services:

```
apps/
  web/              → Next.js frontend (port 3000)
  auth-server/      → JWT authentication service (port 3007)
  internal-api/     → Core business logic API (port 3009)
packages/
  common/
    prisma/         → Shared Prisma client & schema
```

The frontend communicates directly with both `auth-server` (for login) and `internal-api` (for all data). Authentication uses JWT tokens containing `userId`, `role`, `fName`, and `lName`.

## Features

### 🎓 Student Portal (`/student`)
- **Housing Application** — Multi-step wizard to apply for housing (room type, preferences, terms)
- **My Applications** — Track application status (Pending → Approved/Rejected)
- **My Lease** — View active lease details: property, unit/room/bed, lease period, and financial summary
- **Maintenance** — Submit maintenance requests by category (Plumbing, HVAC, Electrical, etc.) and priority; track status
- **Payments** — View balance summary, make simulated payments, and see full payment history
- **Blaze AI Assistant** — Floating smart chatbot powered by Gemini that answers questions using the student's real-time housing context (lease info, balance, open tickets)

### 🏢 Staff Portal (`/staff`)
- **Applications** — Review all student applications, approve or reject with status updates
- **Leases** — View and manage all active leases across properties; update lease statuses
- **Maintenance** — Dashboard of all maintenance tickets with filters, staff assignment, and status management
- **Payments** — View all tenant payment records with revenue stats and method filtering

### 🔐 Admin Portal (`/admin`)
- **User Management** — Full CRUD for user accounts (create, edit role, delete)

## Database Models

| Model | Description |
|-------|-------------|
| `User` | Students, staff, and admins with role-based access |
| `Property` | Housing buildings (dorms, apartments) |
| `Unit / Room / Bed` | Hierarchical space management |
| `HousingApplication` | Student applications with status tracking |
| `Lease` | Active lease agreements (by unit, room, or bed) |
| `MaintenanceRequest` | Maintenance tickets with category, priority, status |
| `Payment` | Payment records linked to leases |

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL running locally (database name: `mavhousing`)

### Install
```bash
npm install
```

### Environment Setup

Create a `.env` file in the root of the project. The key variables required are:

```env
# Database Configuration
# NOTE: Replace "postgres" with your local PostgreSQL username. 
# On Mac (Homebrew/Postgres.app), this is usually your system username.
SQL_DATABASE_URL="postgresql://postgres:password@localhost:5432/mavhousing"

# Authentication
JWT_SECRET="your-secret-key"

# AI Integration (Required for Blaze Chatbot)
GEMINI_API_KEY="your_gemini_api_key_here"
```

### Run

Start all three services in separate terminals:

```bash
# 1. Auth server (port 3007)
npm run start:auth

# 2. Internal API (port 3009)
npm run start:internal

# 3. Web frontend (port 3000)
cd apps/web && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **API Docs**: Swagger available at [http://localhost:3009/api](http://localhost:3009/api)

## Test Accounts

| Role | NetID | Password |
|------|-------|----------|
| Student | `axr0966` | `BlueOrigin@26` |
| Staff | `staffone` | `StaffPass@1` |
| Admin | `adminone` | `AdminPass@1` |
