# 🤖 AGENTS & AI ASSISTANT OPERATING RULES — TOKOKU

This file governs the operational behavior, context retention, and automated workflows for any AI assistant (including Antigravity) working in this repository across all chat sessions.

---

## 1. USER IDENTITY & GREETING RULE (STRICT)
* **User's Name:** Dalvin
* **MANDATORY GREETING:** You MUST start EVERY single response with the name **"Dalvin,"** (e.g., `Dalvin, ...`). Never omit this greeting.

---

## 2. CONTEXT & INTERLINKED DOCUMENTATION MAP
Before answering or executing any task, ALWAYS read and synchronize with the following documents:
- 📜 **Master Context:** [docs/MASTER_PROJECT_CONTEXT.md](../docs/MASTER_PROJECT_CONTEXT.md)
- 🔄 **Workflow & Roadmap:** [docs/WORKFLOW.md](../docs/WORKFLOW.md)
- 🏗️ **Architecture & Tech Specs:** [docs/RANCANGAN_ARSITEKTUR_TOKOKU.md](../docs/RANCANGAN_ARSITEKTUR_TOKOKU.md)
- 📋 **Task Breakdown & TDD Verification:** [docs/BREAKDOWN_TUGAS_DAN_TESTING.md](../docs/BREAKDOWN_TUGAS_DAN_TESTING.md)
- 🐙 **Git & GitHub Guide:** [docs/guides/PANDUAN_GIT_GITHUB.md](../docs/guides/PANDUAN_GIT_GITHUB.md)
- ⚡ **Supabase Setup Guide:** [docs/guides/PANDUAN_SETUP_SUPABASE.md](../docs/guides/PANDUAN_SETUP_SUPABASE.md)
- 🎨 **Design System & UI/UX Guidelines:** [docs/PANDUAN_DESIGN_SYSTEM_TOKOKU.md](../docs/PANDUAN_DESIGN_SYSTEM_TOKOKU.md)
- 👑 **AI Engineering Principles:** [docs/guides/PRINSIP_PENGEMBANGAN_AI.md](../docs/guides/PRINSIP_PENGEMBANGAN_AI.md)
- 🖼️ **Visual Design References:** [Design Reference/](../Design%20Reference/) (Images & StitchAI prompts)

---

## 3. AUTOMATED GITHUB WORKFLOW & PORTFOLIO POLICY (INDUSTRY STANDARD)
* **Automated Multi-Metric GitHub Flow:** Whenever completing a feature, bug fix, or significant task, the assistant executes the automated workflow via `scripts/github-workflow.mjs` or direct GitHub REST API:
  1. **Issue Creation:** Automatically open a GitHub Issue describing the task.
  2. **Feature Branching:** Create a dedicated branch (e.g., `feat/...` or `fix/...`).
  3. **Conventional Commit:** Commit changes referencing the issue (e.g., `closes #X`).
  4. **Pull Request (PR):** Push branch, open PR with clear overview, and merge into `main`.
  5. **Auto-Close & Sync:** Issue automatically closes, branch is cleaned up, and `main` is updated.
* **Direct Commit Fallback:** For small documentation or quick polish tweaks, direct `git add .`, `git commit -m "..."`, and `git push` remains active.
* **Commit Message Format (Conventional Commits in English):**
  - `feat(<scope>)`: New feature implementation
  - `fix(<scope>)`: Bug fix
  - `docs(<scope>)`: Documentation updates
  - `style(<scope>)`: UI styling, layouts, color tokens
  - `refactor(<scope>)`: Code refactoring without changing functionality
  - `test(<scope>)`: Adding or updating test suites
  - `chore(<scope>)`: Dependencies, build scripts, configuration files

---

## 4. DESIGN & ARCHITECTURE CONSTRAINTS (ZERO DEVIATION)
1. ⛔ **ZERO GRADIENTS RULE:** ABSOLUTELY NO GRADIENTS anywhere. 100% solid, flat colors only (`#6FA084` Sage Green, `#F4F4F0` Light Cream Background, `#FFFFFF` Card Surface, `#2C2C2C` Dark Charcoal Sidebar).
2. **Framework & Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Shadcn UI, Zustand, Supabase (PostgreSQL & Realtime Channels).
3. **No Unrequested Features & Endless Clarification Rule:** Do not invent features independently. ALWAYS ask and confirm with Dalvin whenever you are unsure, have options to choose from, or need clarification. You are encouraged to ask as many questions as needed without limit, and you MUST always provide clear recommendations for each question.
4. **TDD / Verification First:** Build and verify each component/module iteratively before marking it as complete.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
