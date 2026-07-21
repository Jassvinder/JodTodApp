# Project Working Notes

Read this file before making changes in this repository.
The standard agent instruction file name for this project is `AGENTS.md`.

## Language Rules (STRICT)

- **Chat with user:** Hinglish (Hindi + English mix)
- **Code, comments, variable names:** English ONLY
- **UI content, labels, buttons:** English ONLY
- **Documentation files (Docs/):** English ONLY
- **Git commit messages:** English ONLY
- NO Hindi/Hinglish anywhere in the codebase. All project content must be in English.

## Project Overview

JodTod is an expense tracker & splitter app. Users can track personal expenses and split group expenses with settlement calculation.
AND manage the daily and future tasks and assign any tasks to others and daily tasks reminders.

## Project Snapshot

- This is an Expo / React Native TypeScript app.
- Main app code appears under `app/`, `components/`, `services/`, `stores/`, `utils/`, `types/`, and `constants/`.
- Native Android project files are under `android/`.
- Project configuration is in `app.json`, `package.json`, `tsconfig.json`, `tailwind.config.js`, and `eas.json`.

## Source of Truth

- Mobile app source of truth: this repository, `D:\Development\Projects\JodTodApp`.
- Mobile documentation source of truth: `Docs/` in this repository.
- Backend/web source of truth: `D:\Development\Projects\JodTod`.
- Backend/web documentation source of truth: `D:\Development\Projects\JodTod\Docs`.
- Do not treat copied, archived, generated, or error-log files as active documentation unless the user explicitly says so.

## Backend Code

- **Backend:** Laravel (PHP)
- **Database:** MySQL
- **Backend Folder:** ../JodTod OR D:\Development\Projects\JodTod.
- **Backend Working Rule:** before made changes in backend read AGENTS.md file on root in backend folder.

## Cross-Repository Work Rule

- This repository is the mobile app source of truth.
- If a task requires backend changes, first switch to `D:\Development\Projects\JodTod` and read that repository's `AGENTS.md`.
- Follow the target repository's `AGENTS.md`, `Docs/TASKS.md`, and `Docs/PROGRESS.md` before editing files there.
- Keep mobile documentation in this repository and backend documentation in the backend repository, except for explicit cross-references.

## Before Editing Checklist

1. Read this `AGENTS.md`.
2. Read the relevant files in `Docs/`.
3. Check `Docs/TASKS.md` for current task status.
4. Inspect the existing implementation before changing code.
5. Keep the change scoped to the requested task.
6. Run the relevant verification command when available.
7. Update `Docs/TASKS.md` and `Docs/PROGRESS.md` after completing a task.

## Screenshot Reference Rule

- If the user asks to check, inspect, compare, or use a screenshot, check `Docs/Screenshots/` first before asking the user for another image.
- Treat screenshot files as reference material only; do not modify or delete them unless the user explicitly asks.

## Working Rules

- Inspect the existing implementation before editing.
- Keep changes scoped to the requested task.
- Do not revert user changes or unrelated work.
- Prefer existing project patterns, imports, styling conventions, and folder structure.
- Use TypeScript types where available instead of introducing `any`.
- Avoid broad refactors unless they are necessary for the requested change.

## Sensitive Files

- Do not commit or expose `.env`, `.env*.local`, keystores, signing credentials, Firebase service account files, private keys, or generated credential payloads.
- Treat files under `Docs/ErrorFiles/` and generated logs as reference material only, not active project instructions.
- If a task requires changing secrets or credentials, confirm the exact requirement before editing.

## Documentation Files (MUST READ before working)

All project documentation is in the `Docs/` folder:
Use the files listed below as active documentation. Other files or folders under `Docs/` are reference material unless explicitly listed here or requested by the user.

| File                          | Purpose                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| `Docs/API_INTEGRATION.md`     | Mobile app API integration guide for Laravel backend endpoints, auth, and request/response handling    |
| `Docs/APP_ARCHITECTURE.md`    | Mobile app architecture, folder structure, navigation, state management, and reusable component layout |
| `Docs/APP_FLOW.md`            | Complete mobile app screen flow, user journeys, and navigation paths                                   |
| `Docs/OFFLINE_SYNC.md`        | Offline-first data handling, local storage strategy, sync queue, and conflict handling                 |
| `Docs/PROGRESS.md`            | Development progress log covering completed work, current status, and next steps                       |
| `Docs/README.md`              | Documentation index and recommended reading order for the mobile app docs                              |
| `Docs/SYSTEM_REQUIREMENTS.md` | Development machine setup, required tools, SDKs, and platform-specific requirements                    |
| `Docs/TASKS.md`               | Mobile app task tracker for pending, current, and completed work                                       |
| `Docs/TECH_STACK.md`          | Technology stack decisions, versions, and reasons for choosing React Native with Expo                  |
| `Docs/TIMELINE.md`            | Phase-wise development timeline with estimated durations and deliverables                              |
| `Docs/TROUBLESHOOTING.md`     | Common mobile app development issues and their fixes                                                   |

## Code Architecture Rules (STRICT - NO DUPLICATION)

### Reusable Components - MANDATORY

- NEVER duplicate code. Every repeating UI section MUST be a component.
- If any piece of UI appears on 2+ pages, extract it into a reusable component.

## Verification

- Check `package.json` scripts before running commands.
- For app behavior changes, prefer running the relevant lint, typecheck, tests, or Expo command available in this project.
- If verification cannot be run, mention why in the final response.

## Key Rules

1. Always check `Docs/TASKS.md` before starting any work
2. Update `Docs/PROGRESS.md` after completing any task
3. Move completed tasks to "Completed" section in `Docs/TASKS.md` with `[X]` and completion date, for example: `- [X] Task title (DD-MM-YYYY)`
