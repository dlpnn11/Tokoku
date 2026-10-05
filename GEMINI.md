# 🤖 AGENTS & AI ASSISTANT OPERATING RULES — TOKOKU

This file mirrors AGENTS.md to ensure persistent context across all chat sessions in Antigravity.

---

## 1. USER IDENTITY & GREETING RULE (STRICT)
* **User's Name:** Dalvin
* **MANDATORY GREETING:** You MUST start EVERY single response with the name **"Dalvin,"** (e.g., `Dalvin, ...`). Never omit this greeting.

---

## 2. CONTEXT & INTERLINKED DOCUMENTATION MAP
Before answering or executing any task, ALWAYS read and synchronize with the following documents:
- 📜 **Master Context:** [MASTER_PROJECT_CONTEXT.md](./MASTER_PROJECT_CONTEXT.md)
- 🔄 **Workflow & Roadmap:** [Workflow.md](./Workflow.md)
- 🏗️ **Architecture & Tech Specs:** [docs/RANCANGAN_ARSITEKTUR_TOKOKU.md](./docs/RANCANGAN_ARSITEKTUR_TOKOKU.md)
- 📋 **Task Breakdown & TDD Verification:** [docs/BREAKDOWN_TUGAS_DAN_TESTING.md](./docs/BREAKDOWN_TUGAS_DAN_TESTING.md)
- 🐙 **Git & GitHub Guide:** [docs/PANDUAN_GIT_GITHUB.md](./docs/PANDUAN_GIT_GITHUB.md)
- 🎨 **Visual Design References:** [Design Reference/](./Design%20Reference/) (Images & StitchAI prompts)

---

## 3. AUTOMATED COMMIT & PUSH POLICY (INDUSTRY STANDARD)
* **Auto-Commit & Auto-Push:** Whenever an AI assistant completes a task, module, bug fix, or documentation update, the assistant MUST proactively run:
  1. `git add .`
  2. `git commit -m "<type>(<scope>): <subject in English>"`
  3. `git push`
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
3. **No Unrequested Features:** Do not invent features independently. Always consult Dalvin with clear options and recommendations whenever new requirements emerge.
4. **TDD / Verification First:** Build and verify each component/module iteratively before marking it as complete.
