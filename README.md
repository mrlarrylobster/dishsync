# DishSync

A collaborative meal planning and recipe sharing application.

## Project Structure

```
dishsync/
├── backend/          # FastAPI Python backend
│   ├── app/
│   │   ├── api/      # API route handlers
│   │   ├── models/   # Database models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── services/ # Business logic
│   │   └── db/       # Database setup
│   ├── alembic/      # Database migrations
│   ├── tests/        # Test suite
│   └── requirements.txt
├── frontend/         # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   ├── lib/      # API clients, utilities
│   │   ├── types/    # TypeScript types
│   │   └── App.tsx
│   └── package.json
├── docs/             # Documentation
├── scripts/          # Utility scripts
└── README.md
```

## Development Standards

### Code Quality
- **Type safety**: Strict TypeScript on frontend, Pydantic schemas on backend
- **Tests**: Backend tests with pytest, aim for 80%+ coverage
- **Linting**: ESLint + Prettier for frontend, ruff for Python
- **Pre-commit hooks**: Enforce formatting and tests before commits

### Git Workflow
- **Main branch**: Always deployable
- **Feature branches**: `feature/description` format
- **Commits**: Meaningful messages, no "fix" or "wip" without context
- **Pull requests**: Require CI pass before merge

### API Design
- RESTful endpoints under `/api/`
- Version in URL: `/api/v1/`
- Consistent error responses: `{ "detail": "message" }`
- Pydantic validation for all inputs

### Database
- SQLite for development
- Alembic migrations required for schema changes
- Models use SQLAlchemy with explicit types

## CI/CD

- **GitHub Actions**: Test + build on every push
- **Pre-commit**: Local checks before commit
- **Deployment**: Manual via ssh to VM

## Environment

- Backend: Python 3.12, FastAPI, SQLAlchemy
- Frontend: Node 22, React 19, Vite, Tailwind
- Database: SQLite (dev), PostgreSQL (future)

## Getting Started

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)
