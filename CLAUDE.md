# CLAUDE.md

## 🧠 Project Overview

This is a full-stack Prompt Platform built using Next.js (App Router), TypeScript, Prisma, and AI integrations.

Users can:

* Create prompts
* Publish prompts (after moderation)
* Like / interact with prompts
* View public prompt library

Admins can:

* Review flagged/pending prompts
* Approve / reject content
* Manage users

---

## 🏗️ Tech Stack

* Next.js (App Router)
* TypeScript
* Prisma ORM
* PostgreSQL (or compatible DB)
* Tailwind CSS
* AI APIs (OpenAI for moderation)

---

## 📁 Project Structure Rules

* `/app` → routes and layouts (App Router only)
* `/components` → reusable UI components
* `/lib` → utilities (db, auth, moderation, helpers)
* `/api` → server routes inside `/app/api/*`
* `/types` → global TypeScript types

---

## 🔐 Authentication Rules

* Auth must be consistent across all routes
* Use centralized auth provider (context or session)
* Never fetch user separately in each page
* Avoid hydration mismatch (handle loading states properly)

---

## 🧠 AI Moderation Rules

* ALL user-generated content must pass moderation before publishing
* Use moderation utility (`lib/moderation.ts`)
* Possible statuses:

  * "approved"
  * "pending"
  * "rejected"

### Moderation Flow:

1. User submits prompt
2. AI evaluates content
3. सिस्टम decides:

   * Safe → publish
   * Risky → pending review
   * Unsafe → reject

---

## 🗄️ Database Rules (Prisma)

* Always use Prisma Client (no raw queries unless necessary)
* Models must include:

  * `createdAt`
  * `updatedAt` (if needed)
* Prompt model must include:

  * `status`
  * `flagged`
  * `reason`

---

## 🎯 Code Quality Standards

* Use TypeScript strictly (no `any`)
* Use async/await (no .then chains)
* Keep functions small and modular
* Avoid duplicate logic
* Use meaningful variable names

---

## ⚠️ Performance Rules

* Prefer server components over client components
* Avoid unnecessary client-side fetching
* Use caching where possible

---

## 🧪 Error Handling

* Always handle API errors
* Never expose raw errors to users
* Log errors for debugging

---

## 🎨 UI/UX Rules

* Always show loading states (skeletons)
* Avoid flickering (especially auth-related UI)
* Keep UI minimal and clean

---

## 🚫 What to Avoid

* No direct DB access from client
* No unmoderated content publishing
* No inconsistent auth state
* No large monolithic files

---

## 🧩 Development Philosophy

* Build scalable systems, not quick hacks
* Prefer clarity over cleverness
* Every feature must be production-ready

---

## ✅ Expected Behavior

* Consistent auth across routes
* Moderated content only in public feed
* Clean, maintainable codebase
