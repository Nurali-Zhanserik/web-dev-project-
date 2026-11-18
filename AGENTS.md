# AGENTS.md — SleepTracker Repository Instructions

## 1. Purpose & Canonical Architecture
- **Project:** SleepTracker Web Application (personal sleep logging, categories, goals, and statistics).
- **Canonical Active Directories:**
  - `backend_f/` — Django 4.2.29 + Django REST Framework API (`sleep_tracker` project, `sleep_api` app).
  - `frontend_f/` — Angular 17.3.0 standalone SPA (`src/app/core` services/guards/interceptors, `src/app/pages` views).
- **Frozen Legacy Directories:** Do NOT modify or build from `backend/` or `frontend/`; they are pre-defence snapshots kept only for baseline reference.

## 2. Setup & Safe Verification Commands
- **Backend Setup & Checks (run inside `backend_f/`):**
  - Install dependencies: `pip install -r requirements.txt`
  - System check: `python manage.py check`
  - Run test suite: `python manage.py test`
- **Frontend Setup & Checks (run inside `frontend_f/`):**
  - Install dependencies: `npm ci` (or `npm install` if lockfile sync is needed)
  - Typecheck: `npx tsc --noEmit`
  - Production build: `npm run build`

## 3. Coding Conventions & Scope Rules
- Keep changes minimal, localized, and tied to a documented task or risk ID.
- Backend (`backend_f/`): Follow PEP 8, validate all user inputs in DRF serializers, and scope every ORM queryset to `request.user`.
- Frontend (`frontend_f/`): Keep HTTP logic inside `src/app/core/services/`, keep components focused on presentation, and preserve strict TypeScript types.
- Preserve Acceptance Criteria **AC1–AC5** on every change.

## 4. Test Expectations
- Every bug fix or structural refactoring must include focused automated unit/API tests (`backend_f/sleep_api/tests.py` or `*.spec.ts`).
- Report exact commands executed, pass/fail counts, and `git diff` summary before proposing acceptance.

## 5. Forbidden Actions
- **No Secrets:** Never hardcode secret keys, tokens, or passwords in code, docs, or logs. Load production secrets via environment variables.
- **No Production Deployments:** Never run deployment commands or expose local servers publicly.
- **No Destructive Commands:** Never run `git push --force`, `git reset --hard`, `rm -rf` on project directories, or delete baseline commits.
- **No Unreviewed Dependency Changes:** Do not add, upgrade, or remove packages in `requirements.txt` or `package.json` without explicit human approval.
- **No Personal Data in SQLite:** Never commit real user credentials or personal data to `db.sqlite3`.

## 6. Human Review Gate
- AI assistants must never self-approve changes. All proposed patches require human inspection of `git diff` and local verification command outputs before committing.