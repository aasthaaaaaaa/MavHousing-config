# MavHousing

## Overview

**Team:** The Builders Squad  
A NestJS monorepo housing platform for UTA's MavHousing — managing student applications, leasing, maintenance requests, payments, and communications.

## Tech Stack

- **Backend Framework:** [NestJS](https://nestjs.com/) (TypeScript)
- **Frontend:** [Next.js](https://nextjs.org/) (React, TailwindCSS, Radix UI)
- **Database:** [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/) & [MongoDB Atlas](https://www.mongodb.com/) (Mongoose)
- **Cloud Storage:** [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) (S3-compatible bucket storage for media/documents)
- **AI & ML:** [Google Gemini 2.5](https://deepmind.google/technologies/gemini/) (OCR) & `face-api.js` (Image processing)
- **Email:** [Resend](https://resend.com/)
- **SMS:** [Twilio](https://www.twilio.com/)
- **API Docs:** [Swagger](https://swagger.io/) (via `@nestjs/swagger`)
- **Language:** TypeScript

---

## Prerequisites

Make sure you have the following installed before getting started:

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) (v9+)
- [PostgreSQL](https://www.postgresql.org/) (v14+)
- [Git](https://git-scm.com/)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone git@github.com:axjh03/MavHousing-config.git
cd MavHousing-config
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Your `.env` file should contain the following variables:

| Variable            | Description                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `TWILIO_SID`        | Twilio Account SID                                                                         |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token                                                                          |
| `TWILIO_PH_NUM`     | Twilio phone number (e.g. `+18551234567`)                                                  |
| `RESEND_API`        | Resend API key for sending emails                                                          |
| `SQL_DATABASE_URL`  | PostgreSQL connection string (e.g. `postgresql://user:password@localhost:5432/mavhousing`) |

### 4. Set Up the Database

First, make sure PostgreSQL is running and you have created a database (e.g. `mavhousing`).

Generate the Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Seed the database with mock data:

```bash
npm run seed
```

### 5. Run the Application

```bash
npm run start:dev internal-api
```

> **Note:** Running `internal-api` will start all configured services together since they are wired in the monorepo.

---

## Project Structure

```
mav-housing-config/
├── apps/                        # Microservice applications
│   ├── auth-server/             # Authentication & authorization (JWT, RBAC)
│   ├── comms-server/            # Communications (Email via Resend, SMS via Twilio)
│   ├── internal-api/            # Core API (Applications, Leases, Maintenance, Payments)
│   └── mock/                    # Mock service for testing
├── common/                      # Shared utilities & validators
├── libs/                        # Shared libraries
│   ├── auth/                    # Auth helpers
│   ├── common/                  # Common utilities
│   ├── config/                  # Configuration module
│   ├── contracts/               # Shared interfaces & contracts
│   ├── db/                      # Database module (Prisma service)
│   ├── graphql/                 # GraphQL module
│   └── messaging/               # Messaging module
├── prisma/                      # Prisma schema, migrations, and seed script
│   ├── schema.prisma            # Database schema
│   ├── seed.ts                  # Seed script with mock data
│   └── migrations/              # Database migrations
├── docs/                        # Project documentation (architecture, requirements, roadmap)
├── generated/                   # Auto-generated Prisma client
├── .env.example                 # Environment variable template
├── nest-cli.json                # NestJS monorepo configuration
├── package.json                 # Dependencies & scripts
└── tsconfig.json                # TypeScript configuration
```

---

## Microservices

| Service          | Port   | Swagger UI                                      | Description                                            |
| ---------------- | ------ | ----------------------------------------------- | ------------------------------------------------------ |
| **auth-server**  | `3004` | [localhost:3004/api](http://localhost:3004/api) | Authentication, JWT, user management, RBAC             |
| **comms-server** | `3000` | [localhost:3000/api](http://localhost:3000/api) | Email (Resend) & SMS (Twilio) notifications            |
| **internal-api** | `3009` | [localhost:3009/api](http://localhost:3009/api) | Core API — applications, leases, maintenance, payments |

Run any individual service:

```bash
npm run start:dev <service-name>
```

Example:

```bash
npm run start:dev auth-server
```

---

## Available Scripts

| Script              | Command                       | Description                                     |
| ------------------- | ----------------------------- | ----------------------------------------------- |
| **Dev**             | `npm run start:dev <service>` | Start a service in watch mode                   |
| **Debug**           | `npm run start:debug`         | Start with debugger attached                    |
| **Build**           | `npm run build`               | Build the project                               |
| **Production**      | `npm run start:prod`          | Run the production build                        |
| **Lint**            | `npm run lint`                | Lint & auto-fix code                            |
| **Format**          | `npm run format`              | Format code with Prettier                       |
| **Test**            | `npm run test`                | Run unit tests                                  |
| **Test (Watch)**    | `npm run test:watch`          | Run tests in watch mode                         |
| **Test (Coverage)** | `npm run test:cov`            | Run tests with coverage report                  |
| **Test (E2E)**      | `npm run test:e2e`            | Run end-to-end tests                            |
| **Seed**            | `npm run seed`                | Generate Prisma client & seed the database      |
| **Web Dev**         | `npm run web:dev`             | Starts Next.js in development mode (hot reload) |
| **Web Build**       | `npm run web:build`           | Creates a production build                      |
| **Web Start**       | `npm run web:start`           | Serves the production build                     |
| **Web Lint**        | `npm run web:lint`            | Runs ESLint on the web app                      |

---

## Database

### Schema Overview

The Prisma schema (`prisma/schema.prisma`) defines the following models:

- **User** — Students, Staff, and Admins with role-based access
- **Property** — Housing properties (Residence Halls, Apartments)
- **Unit** → **Room** → **Bed** — Hierarchical housing structure
- **Application** — Student housing applications with status tracking
- **Lease** — Lease agreements supporting unit, room, or bed-level assignment
- **Occupant** — Tracks lease holders, occupants, and roommates
- **Payment** — Payment records tied to leases
- **MaintenanceRequest** — Maintenance tickets with category, priority, specific location, media attachments schema, and interactive comments.
- **ChatDocument** *(MongoDB)* — Real-time lease-chat attachment tracking, dynamically indexing user media uploads natively mapped to `.mp4`, `.png`, and `.pdf` objects in Cloudflare R2 bucket.

## Key Features Implemented

* **Smart ID Verification:** AI-driven OCR extraction natively scanning student IDs utilizing **Google Gemini** for intelligent parsing and `face-api.js` local model weights to map and crop geometric face bounds specifically directly into cloud infrastructure.
* **Lease Application Workflows:** Supports granular "By Unit" or "By Room/Bed" booking assignments securely tracked directly alongside occupant configurations.
* **Immersive Maintenance Desk:** Staff and students can converse back-and-forth dynamically inside native React contexts over maintenance comments. Integrated explicit location routing natively tracked inside Postgres databases.
* **Lease Member Real-time Chat:** Real-time Socket.io split-pane dashboard strictly tracking Mongoose Document attachments mapping to pre-signed Cloudflare R2 cloud buckets up to 10MB cleanly over dynamic dialog grids.
* **Native Media Viewers:** Radix UI interactive `<Dialog>` media hubs actively unpacking and rendering `<video>` auto-play containers and native `<img>` schemas dynamically securely straight from the browser DOM.

### Useful Prisma Commands

| Command                                | Description                                        |
| -------------------------------------- | -------------------------------------------------- |
| `npx prisma generate`                  | Regenerate the Prisma client                       |
| `npx prisma migrate dev --name <name>` | Create & apply a new migration                     |
| `npx prisma migrate reset`             | **Reset the database** (drops all data & re-seeds) |
| `npx prisma studio`                    | Open Prisma Studio (visual DB browser)             |
| `npx prisma db push`                   | Push schema changes without creating a migration   |

---

## API Documentation

Each microservice exposes a **Swagger UI** at the `/api` endpoint:

- **Auth Server:** [http://localhost:3004/api](http://localhost:3004/api)
- **Comms Server:** [http://localhost:3000/api](http://localhost:3000/api)
- **Internal API:** [http://localhost:3009/api](http://localhost:3009/api)

The Swagger UI provides interactive API documentation where you can test endpoints directly.

---

## License

This project is **UNLICENSED** — proprietary and for internal use only.
