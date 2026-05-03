# DishSync Development Setup

## Prerequisites

- Python 3.12+
- Node.js 22+
- Git

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt

# Run dev server
uvicorn app.main:app --reload --port 8000
```

## Frontend

```bash
cd frontend
npm install

# Run dev server
npm run dev
```

## Testing

```bash
# Backend
PYTHONPATH=backend pytest backend/tests/ -v

# Frontend type check
npx tsc --noEmit
```

## Database Migrations

```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```
