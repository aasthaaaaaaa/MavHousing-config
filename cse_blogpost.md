# MavHousing

**Team Name**
The Builders Squad

**Timeline**
Fall 2025 – Spring 2026

**Students**
- Alok Jha — Computer Science
- Atiqur Rahman — Computer Science
- Aastha Khatri — Computer Science
- Talha Tamid — Computer Science
- Aviral Saxena — Computer Science
- Md Rashidul Sami — Computer Science

---

## Abstract

MavHousing is a comprehensive, full-stack housing management platform designed for the University of Texas at Arlington (UTA). The system digitizes and unifies the entire student housing lifecycle — from initial housing application and identity verification through lease generation, rent payment processing, maintenance request management, and real-time communication. Built on a microservice architecture with NestJS, Next.js, PostgreSQL, MongoDB, and Redis, MavHousing provides role-specific dashboards for students, staff, and administrators. The platform integrates AI-powered student ID verification via Google Gemini, an AI chatbot assistant ("Blaze"), automated email and SMS notifications, and background report generation to reduce manual administrative overhead and improve the overall student housing experience.

---

## Background

University housing offices across the country continue to rely on fragmented, manual systems for managing housing applications, lease agreements, maintenance workflows, and resident communications. At UTA, these processes involve a combination of paper forms, email threads, and disconnected spreadsheet-based tracking — leading to inefficiency, data inconsistency, and delays in student service. Students often lack a centralized portal to apply for housing, track their application status, manage lease details, make rent payments, or communicate directly with housing staff.

MavHousing was conceived to address these pain points by replacing fragmented workflows with a single, unified, web-based platform. The system introduces role-based access control to serve the distinct needs of students, housing staff, and administrators from a common interface. By leveraging modern web technologies, AI-powered document verification, and automated notification systems, MavHousing demonstrates how a scalable software solution can modernize university housing operations and improve the experience for all stakeholders.

---

## Project Requirements

1. Students must be able to apply for on-campus housing through a guided, multi-step application form that captures lifestyle preferences and roommate compatibility criteria.
2. The system must verify student identity from uploaded ID cards using AI-powered optical character recognition (OCR) and document analysis.
3. Staff must be able to review, approve, or reject housing applications and generate corresponding lease agreements.
4. Leases must support three levels of assignment granularity: full unit, individual room, or individual bed — accommodating both apartment-style and residence hall housing.
5. Students must be able to view their current balance, make rent payments, and access complete payment history through a secure dashboard.
6. Students must be able to submit maintenance requests with categorization (plumbing, HVAC, electrical, internet, appliance, structural), priority level, description, and photo attachments.
7. Staff must be able to assign, track, and resolve maintenance requests with threaded comment support and real-time status updates.
8. The platform must provide an AI-powered virtual assistant ("Blaze") for answering common housing questions and guiding users through platform features.
9. The system must send automated notifications via email (Resend) and SMS (Twilio) for key account events including password resets, application status changes, and system alerts.
10. Administrators must be able to generate occupancy, financial, and lease summary reports on demand and on a monthly automated schedule.

---

## Design Constraints

### 1. Accessibility
The platform must be usable across a wide range of devices and screen sizes. The responsive frontend built with Next.js and Tailwind CSS ensures that students, staff, and administrators can access all features from desktop, tablet, or mobile browsers. The database schema includes ADA access flags on units to support room assignment for students requiring accessible accommodations.

### 2. Security
All user passwords are stored using one-way cryptographic hashing (bcrypt). Authentication is handled via stateless JWT tokens with automatic expiration, eliminating server-side session storage risks. Role-based access control (RBAC) is enforced at the API level through NestJS guards, ensuring that students, staff, and administrators can only access endpoints and data appropriate to their role. Account locking capabilities prevent unauthorized access after suspicious activity.

### 3. Usability
The multi-step housing application form is designed to reduce cognitive load by breaking the process into logical stages. Role-specific dashboards ensure that each user type sees only relevant information and actions. The AI chatbot ("Blaze") provides immediate self-service assistance, reducing the need for direct staff contact for common questions.

### 4. Extensibility
The NestJS monorepo architecture and shared library pattern allow new microservices to be added without modifying existing services. The modular backend design (separate modules for applications, leases, payments, maintenance, chat, housing, and jobs) supports independent development and deployment of new features. The dual-database strategy allows new data types to be stored in whichever database engine best suits their access pattern.

### 5. Maintainability
The entire codebase is written in TypeScript, providing compile-time type safety across frontend and backend. Prisma ORM enforces type-safe database queries and version-controlled migrations, ensuring that database schema changes are tracked and reproducible. Auto-generated Swagger/OpenAPI documentation provides interactive API references that stay synchronized with the implementation. Background job monitoring is available through the Bull Board dashboard.

---

## Engineering Standards

### 1. OAuth 2.0 / JWT (RFC 7519)
**Enforced by:** Internet Engineering Task Force (IETF)
**Standard:** RFC 7519 — JSON Web Token
**Description:** JWT defines a compact, self-contained method for securely transmitting claims between parties as a JSON object. Tokens are digitally signed to ensure integrity and authenticity.
**How the project meets it:** MavHousing uses JWT for stateless authentication. Upon successful login, the auth-server issues a signed JWT containing the user's role, ID, and expiration. All subsequent API requests are authenticated by verifying this token, eliminating the need for server-side session state.

### 2. REST API Design (RFC 7231)
**Enforced by:** Internet Engineering Task Force (IETF)
**Standard:** RFC 7231 — HTTP/1.1 Semantics and Content
**Description:** RESTful API design principles prescribe the use of standard HTTP methods (GET, POST, PUT, DELETE), meaningful URI structures, and proper status codes for building scalable, interoperable web services.
**How the project meets it:** All backend services expose RESTful endpoints following standard HTTP conventions. Resources are organized by domain (e.g., `/applications`, `/leases`, `/maintenance`). Appropriate HTTP status codes (200, 201, 400, 401, 403, 404) are used consistently. All endpoints are documented and testable through auto-generated Swagger/OpenAPI specifications.

### 3. WCAG 2.1 (Web Content Accessibility Guidelines)
**Enforced by:** World Wide Web Consortium (W3C)
**Standard:** WCAG 2.1 Level AA
**Description:** WCAG provides guidelines for making web content more accessible to people with disabilities, covering perceivability, operability, understandability, and robustness.
**How the project meets it:** The frontend uses Radix UI component primitives, which provide built-in accessibility features including keyboard navigation, screen reader support, and ARIA attributes. Responsive design ensures usability across device types and viewport sizes. Color contrast ratios and focus indicators follow WCAG recommendations.

### 4. ISO/IEC 27001 (Information Security Management)
**Enforced by:** International Organization for Standardization (ISO)
**Standard:** ISO/IEC 27001:2022
**Description:** This standard specifies requirements for establishing, implementing, maintaining, and continually improving an information security management system (ISMS), addressing confidentiality, integrity, and availability of information.
**How the project meets it:** MavHousing enforces role-based access control at every endpoint, stores passwords with bcrypt hashing, uses signed JWTs with automatic expiration for session management, and stores uploaded files in Cloudflare R2 with pre-signed URL access to prevent unauthorized file retrieval. Sensitive credentials are managed through environment variables, not hardcoded.

### 5. IEEE 802.11 (Wireless LAN)
**Enforced by:** Institute of Electrical and Electronics Engineers (IEEE)
**Standard:** IEEE 802.11 (Wi-Fi)
**Description:** This family of standards defines the protocols for wireless local area network (WLAN) communication, enabling devices to connect to networks without physical cables.
**How the project meets it:** MavHousing is a web-based application accessed entirely through standard web browsers over HTTP/HTTPS and WebSocket protocols. The platform is designed to function reliably over university Wi-Fi networks (IEEE 802.11), with real-time chat features using Socket.IO for persistent WebSocket connections. The responsive design ensures usability over varying network conditions common in wireless environments.

---

## System Overview

MavHousing is architected as a **NestJS monorepo** comprising three independent backend microservices and a **Next.js** frontend application:

- **Auth Service** — Handles user authentication (login, signup, password reset), JWT token issuance, and role-based access control (RBAC) enforcement. Runs independently on port 3004.
- **Core API (Internal API)** — The central business operations hub managing housing applications, lease contracts, rent payments, maintenance requests, real-time chat (via Socket.IO), AI assistant integration (Google Gemini), and scheduled background job processing (BullMQ). Runs on port 3009.
- **Comms Service** — A decoupled notification service responsible for outbound email delivery (via Resend) and SMS alerts (via Twilio). Runs on port 3000.
- **Web Client** — A Next.js (App Router) frontend providing role-specific dashboards for students, staff, and administrators. Built with Tailwind CSS, Radix UI, and Lucide Icons for a polished, responsive user experience.

The system employs a **dual-database strategy**: PostgreSQL (via Prisma ORM) stores all structured, high-integrity data (users, leases, applications, payments, maintenance records), while MongoDB (via Mongoose) handles flexible, high-velocity data (chat messages, comments, attachments). Redis powers BullMQ for background job processing (PDF report generation, scheduled tasks), and Cloudflare R2 provides S3-compatible distributed object storage for uploaded files (student IDs, maintenance photos, generated reports).

Google Gemini 2.5 is integrated for two AI-powered capabilities: an intelligent OCR engine for automated student ID verification during the application process, and the "Blaze" AI chatbot assistant that provides conversational support for housing-related questions.

---

## Results

MavHousing was successfully developed as a fully functional, end-to-end housing management platform. The system demonstrates complete workflows from student application submission through AI-powered ID verification, staff review and lease generation, rent payment tracking, maintenance request lifecycle management, and real-time chat communication. The microservice architecture, dual-database strategy, and background job processing proved effective in maintaining responsive performance while handling computationally intensive tasks such as PDF report generation. *(Include demo video link(s) here once recorded.)*

---

## Future Work

- **Online payment gateway integration** — Connect to Stripe or a similar payment processor for real-time credit card and ACH payment processing, replacing the current payment tracking model with live transactions.
- **Native mobile application** — Extend the platform to iOS and Android using React Native for on-the-go access to maintenance submissions, chat, payments, and notifications.
- **AI-driven roommate matching** — Leverage the existing lifestyle preference data (sleep schedule, noise level, cleanliness, dietary restrictions) to suggest compatible roommate pairings automatically using machine learning.
- **Automated lease renewal workflow** — Notify students of upcoming lease expirations and provide a streamlined, one-click renewal process.
- **Multi-property analytics dashboard** — Provide administrators with cross-property occupancy trends, revenue forecasting, and predictive maintenance insights.
- **Full WCAG 2.1 AA accessibility audit** — Conduct a comprehensive accessibility audit and remediate any gaps to ensure full ADA/WCAG compliance across all user interfaces.

---

## Project Files

- **Project Charter:** *(Link to PDF)*
- **System Requirements Specification (SRS):** *(Link to PDF)*
- **Architecture Design Specification (ADS):** *(Link to PDF)*
- **Detailed Design Specification (DDS):** *(Link to PDF)*
- **Project Poster:** *(Link to PDF)*
- **Closeout Materials / Source Code ZIP:** *(Link to ZIP file)*


---

## References

1. NestJS Documentation. https://docs.nestjs.com/
2. Next.js Documentation. https://nextjs.org/docs
3. Prisma ORM Documentation. https://www.prisma.io/docs
4. MongoDB Atlas Documentation. https://www.mongodb.com/docs/atlas/
5. BullMQ Documentation. https://docs.bullmq.io/
6. Google Gemini API Documentation. https://ai.google.dev/docs
7. Radix UI Documentation. https://www.radix-ui.com/docs/primitives
8. Resend Email API Documentation. https://resend.com/docs
9. Twilio SMS API Documentation. https://www.twilio.com/docs/sms
10. Cloudflare R2 Documentation. https://developers.cloudflare.com/r2/
11. Socket.IO Documentation. https://socket.io/docs/
12. Swagger/OpenAPI Specification. https://swagger.io/specification/
13. JSON Web Token (RFC 7519). https://datatracker.ietf.org/doc/html/rfc7519
14. WCAG 2.1 Guidelines. https://www.w3.org/TR/WCAG21/
