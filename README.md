# MavHousing

## Overview
Team: The Builders Squad
A Monolithic application for MavHousing

## Tech Stack
- NestJS
- NextJS
- PostgreSQL
- Resend
- Twilio
- Docker
- TypeScript

## Setup

Clone the repository:
```bash
git clone git@github.com:axjh03/MavHousing-config.git
```

Install dependencies:
```bash
npm install
```

Run the application:
The backend microservices are located in apps/:
- auth-server
- comms-server
- internal-api


```bash
npm run start:dev <microservice> 
```

Example:
```bash
npm run start:dev internal-api
```
You can just run `npm run start:dev internal-api` to run the all at once since the services are configured to run together.


## (Temproary) Running with prisma and postgres
Since in development phase, we are using prisma and postgres to manage the database and avoiding cloud db.

First install postgresql and then setup superuser.

Then generate and migrate:
```bash
npx prisma generate
npx prisma migrate dev --name ANY_NAME
```

Run seed:
```bash
npm run seed
```
Now you should have mock data in your localdb instance.

## RESETS database
If you ever need to reset the database, you can use the following command:
```bash
npx prisma migrate reset
```

## View database
```bash
npx prisma studio
```
