# Prompt Library (MVP) — with AI Rating System

Production-ready SaaS starter for a **Prompt Library with AI Rating System**:

- **Next.js** (App Router, TypeScript)
- **Prisma ORM** + **PostgreSQL**
- **OpenAI API** integration (auto-mocks if `OPENAI_API_KEY` is missing)
- **Tailwind CSS** UI
- **Simple auth** via JWT stored in an httpOnly cookie

## Features

- **Upload**: paste a prompt, run AI analysis (accuracy/clarity + suggestions), save as draft
- **Dashboard**: private list of your prompts + ratings, publish button
- **Public library**: search + copy + like
- **Like protection**: one like per user per prompt (unique constraint)
- **Publishing guard**: can’t publish unless analysis exists

## Setup

### 1) Configure env

Copy `.env.example` → `.env` and set:

- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY` (optional)

### 2) Run Postgres

This starter expects Postgres on `localhost:5432` by default.

If you don’t have Postgres installed, install it locally (or point `DATABASE_URL` to your managed DB).

### 3) Run migrations + seed

```bash
npm run db:migrate
npm run db:seed
```

Note: Prisma v7 uses `prisma.config.ts` for the datasource URL (the schema no longer contains `url = env("DATABASE_URL")`).

### 4) Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Routes

- **Pages**
  - `/upload`
  - `/dashboard`
  - `/library`

- **API**
  - `POST /api/analyze`
  - `POST /api/prompt` (create draft)
  - `POST /api/publish`
  - `POST /api/like`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`

