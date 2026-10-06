---
name: fullstack-architect
description: >-
  Use this skill whenever brainstorming, planning, or architecting a new application or feature across Web (Next.js/React), Mobile (Android/Flutter/Kotlin), AI/ML pipelines, or Automation. Guides system design, database ERD, API contracts, tech stack selection, and milestone roadmap.
---

# 🏛️ Fullstack & Multi-Platform System Architect Skill

This skill guides the AI and Dalvin through structured, battle-tested system design and architecture planning before writing any code. It applies whether building Web applications, Android apps, AI/ML pipelines, or background automation services.

---

## 🧭 Architectural Principles

1. **Clarify First (Zero Assumption):** Never assume business requirements, user roles, or data relationships. Always ask and confirm choices with Dalvin.
2. **Modular & Scalable:** Decouple data layer, business logic, and presentation layer.
3. **Database as Single Source of Truth:** Start from the data model (ERD, relations, constraints, indexing, Row Level Security).
4. **API Contract First:** Define exact request/response payloads before UI or frontend development begins.
5. **Aesthetic Discipline:** When UI is involved, strictly follow flat, solid color palettes (Zero Gradients rule, clean typography, high visual polish).

---

## 🛠️ Step-by-Step Architecture Blueprint Workflow

### Step 1: Requirements & Problem Scoping
- **Core Value Proposition:** What problem does this application solve?
- **Target Platform(s):** Web (Desktop/Mobile Web), Android Native/Hybrid, AI Background Worker, or Desktop CLI/GUI.
- **User Personas & Roles:** Define permissions and access levels (e.g., Owner, Admin, Cashier, Customer, Bot).

### Step 2: Tech Stack Decision Matrix
Evaluate the optimal stack based on project nature:
- **Web Fullstack:** Next.js (App Router), TypeScript, Tailwind CSS, Shadcn UI, Zustand.
- **Mobile (Android):** Kotlin (Jetpack Compose) or Flutter / React Native, connected to Supabase REST/GraphQL/Realtime API.
- **AI / ML Workflows:** Python (FastAPI / PyTorch / Pandas / Scikit-Learn), containerized or exposed via REST endpoints.
- **Database & Auth:** PostgreSQL (Supabase) with Row Level Security (RLS) and Realtime channels.
- **Caching & Queue (if needed):** Redis for session/caching, BullMQ/Inngest/Celery for background job queues.

### Step 3: Entity-Relationship Diagram (ERD) & Database Schema
1. Define entities, primary keys (UUID recommended), foreign keys, and indexes.
2. Draft SQL DDL schema with constraints (`CHECK`, `NOT NULL`, `DEFAULT`).
3. Formulate Row Level Security (RLS) policies for multi-tenant or role-based security.
4. Prepare RPC (Stored Procedures) for atomic transactions or heavy aggregations.

### Step 4: API & Integration Specifications
- Standardize REST or Server Action endpoints:
  - `GET /api/v1/[resource]`
  - `POST /api/v1/[resource]`
  - `PATCH /api/v1/[resource]/:id`
  - `DELETE /api/v1/[resource]/:id`
- Document request parameters, response JSON schemas, error codes, and validation rules (Zod / Pydantic).

### Step 5: Directory Structure & File Architecture
Draft an intuitive, scalable directory structure tailored to the chosen framework:
```text
src/
├── app/                  # Next.js App router routes
├── components/           # Reusable UI & feature components
├── lib/                  # Utilities, Supabase client, helpers
├── services/             # Core business logic & database queries
├── types/                # TypeScript type definitions
└── store/                # Zustand global state stores
```

### Step 6: Step-by-Step Implementation Roadmap (TDD & Verification)
Break the build into manageable phases:
- **Phase 1: Foundation & Database Setup** (Migration SQL, Supabase connection, types).
- **Phase 2: Core Business Logic & API Layer** (CRUD services, RPCs, tests).
- **Phase 3: UI / Interface & State Management** (Components, Zustand, responsive layout).
- **Phase 4: Realtime / Integration / External Tools** (Channels, webhooks, notifications).
- **Phase 5: Polishing, Security Audit, & Verification** (RLS testing, error handling, performance).
