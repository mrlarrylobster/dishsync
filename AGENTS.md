# AGENTS.md — DishSync Development Guide

## Project Identity

**DishSync** — A collaborative meal planning and recipe sharing application.

## Development Principles

### 1. Type Safety First
- **Frontend**: Strict TypeScript (`strict: true` in tsconfig)
- **Backend**: Pydantic schemas for all API inputs/outputs
- **Database**: SQLAlchemy models with explicit column types
- No `any` types without documented justification

### 2. Test Coverage
- **Minimum 80%** backend coverage (pytest)
- Tests run on every commit via pre-commit hooks
- Test database is separate from dev database
- Mock external services (APIs, file systems)

### 3. API Design Standards
- RESTful under `/api/v1/`
- Consistent error format: `{"detail": "human-readable message"}`
- HTTP status codes used correctly (400, 404, 409, 422, 500)
- Pydantic validation for all request bodies and query params
- Pagination on list endpoints: `?limit=20&offset=0`

### 4. Database Standards
- Alembic migrations for every schema change
- Models define `__tablename__`, explicit Column types
- Foreign keys with `ondelete` behavior specified
- JSON columns only for truly dynamic data
- SQLite for dev, PostgreSQL for production

### 5. Code Organization
```
backend/
  app/
    api/        # Route handlers (thin layer)
    models/     # SQLAlchemy models
    schemas/    # Pydantic schemas
    services/   # Business logic (thick layer)
    db/         # Connection, migrations
  tests/
    test_api.py        # Integration tests
    test_services.py   # Unit tests
    conftest.py        # Fixtures

frontend/
  src/
    components/   # React components
    lib/          # API clients, utilities
    types/        # Shared TypeScript types
    hooks/        # Custom React hooks
```

### 6. Git Workflow
- `main` branch is always deployable
- Feature branches: `feature/description`
- Bugfix branches: `fix/description`
- **Commit messages**: Imperative mood, specific scope
  - ✅ "Add recipe import from URL endpoint"
  - ❌ "fix stuff" or "changes"
- No direct pushes to `main` (except automation)

### 7. CI/CD Pipeline
- **GitHub Actions** on every push to `main` or PR
- Backend: install deps → run pytest
- Frontend: install deps → build → type-check
- Pre-commit hooks locally before commit
- No merge if CI fails

### 8. Documentation
- README: setup, architecture, key decisions
- API docs: auto-generated from OpenAPI (FastAPI built-in)
- Architecture decisions: `docs/ADR-NNN-title.md`
- Environment setup: `docs/DEVELOPMENT.md`

### 9. Security
- Secrets in `.env` (never committed)
- API keys / tokens in `~/.openclaw/secrets/`
- Input validation on all endpoints
- No SQL injection (use ORM, not raw queries)
- CORS configured explicitly

### 10. Performance
- Database queries use `selectinload` or `joinedload` for relations
- Frontend: lazy load routes, optimize bundle size
- Pagination on all list endpoints
- Nginx serves static files, proxies API

## Tools

| Layer | Tool | Purpose |
|-------|------|---------|
| Backend | FastAPI | API framework |
| Backend | SQLAlchemy | ORM |
| Backend | Alembic | Migrations |
| Backend | pytest | Testing |
| Frontend | React 19 | UI framework |
| Frontend | Vite | Build tool |
| Frontend | Tailwind | Styling |
| Frontend | TypeScript | Type safety |
| DevOps | GitHub Actions | CI/CD |
| DevOps | pre-commit | Local checks |

## Communication

- David (product owner + developer)
- Ask clarifying questions when requirements are ambiguous
- Proactive updates on blockers or scope changes
- Never commit without running tests first
