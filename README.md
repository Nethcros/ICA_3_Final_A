# Quiz System — Backend API

> **Note:** This README was generated with the assistance of a large language model.

REST API backend for a quiz management system. Built with Node.js, Express 5, TypeScript (strict), Drizzle ORM, and MySQL. Pairs with a React/Vite frontend.

---

## Tech stack

- **Runtime:** Node.js with Express 5
- **Language:** TypeScript (strict mode, `noUncheckedIndexedAccess`)
- **ORM:** Drizzle ORM with mysql2
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Logging:** Winston
- **Linting:** typescript-eslint strict + stylistic, `no-console` enforced

---

## Prerequisites

- Node.js 20+
- MySQL 8+ with a database created (default name: `groupproj3`)

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set DB credentials and a real JWT_SECRET

# 3. Generate and apply migrations
npm run db:generate
npm run db:migrate

# 4. Seed test accounts
npm run db:seed
```

---

## Running

```bash
# Development (hot reload)
npm run start:dev

# Production build
npm run build
npm start
```

Server runs on `http://localhost:7000` by default (set `PORT` in `.env` to override).

---

## Test credentials

Seeded by `npm run db:seed`:

| Role    | Email               | Password    |
|---------|---------------------|-------------|
| Teacher | teacher@test.com    | password123 |
| Student | student@test.com    | password123 |

---

## API overview

All routes except `POST /auth/login` require an `Authorization: Bearer <token>` header.

### Auth
| Method | Path         | Auth     | Description        |
|--------|--------------|----------|--------------------|
| POST   | /auth/login  | Public   | Returns JWT + user |

### Quizzes
| Method | Path                    | Role    | Description                                          |
|--------|-------------------------|---------|------------------------------------------------------|
| GET    | /quizzes                | Any     | List all quizzes (correctOption hidden from students)|
| POST   | /quizzes                | Teacher | Create quiz with questions                           |
| GET    | /quizzes/:quizId        | Any     | Get single quiz (correctOption hidden from students) |
| PUT    | /quizzes/:quizId        | Teacher | Update quiz title/desc                               |
| DELETE | /quizzes/:quizId        | Teacher | Delete quiz                                          |
| GET    | /quizzes/:quizId/scores | Teacher | All scores for a quiz                                |

### Students
| Method | Path                                        | Role           | Description                           |
|--------|---------------------------------------------|----------------|---------------------------------------|
| GET    | /students                                   | Teacher        | List all students                     |
| GET    | /students/:studentId/assignments            | Self or Teacher| Quizzes assigned to student           |
| GET    | /students/:studentId/scores                 | Self or Teacher| Submission scores for student         |
| POST   | /students/:studentId/quizzes/:quizId/submit | Self (Student) | Submit answers for an assigned quiz   |

### Assignments
| Method | Path         | Role    | Description                     |
|--------|--------------|---------|---------------------------------|
| POST   | /assignments | Teacher | Assign a quiz to a student      |

---

## Questions format

All questions are multiple choice with options A–D.

```json
{
  "questionText": "What is 2 + 2?",
  "optionA": "3",
  "optionB": "4",
  "optionC": "5",
  "optionD": "6",
  "correctOption": "B"
}
```

---

## Scripts

| Command            | Description                        |
|--------------------|------------------------------------|
| `npm run start:dev`| Dev server with hot reload         |
| `npm run build`    | Compile TypeScript to `dist/`      |
| `npm start`        | Run compiled build                 |
| `npm run typecheck`| Type-check without emitting        |
| `npm run lint`     | Run ESLint                         |
| `npm run db:generate` | Generate migration from schema  |
| `npm run db:migrate`  | Apply migrations to DB          |
| `npm run db:seed`     | Insert test users                |
| `npm run db:studio`   | Open Drizzle Studio (DB GUI)    |
