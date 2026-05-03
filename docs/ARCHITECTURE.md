# DishSync Architecture

## Overview

DishSync is a collaborative meal planning and recipe sharing application.

## Tech Stack

- **Backend**: FastAPI (Python) + SQLAlchemy + SQLite/PostgreSQL
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Deployment**: VM with systemd + nginx (same pattern as Larry Dashboard)
- **CI/CD**: GitHub Actions

## Key Features (Planned)

1. Recipe storage and organization
2. Meal planning calendar
3. Shopping list generation
4. Nutritional information tracking
5. User collaboration (share recipes, meal plans)

## API Structure

```
/api/v1/
  /recipes
  /meal-plans
  /shopping-lists
  /users
```

## Database Schema (Planned)

- `recipes` — Recipe storage
- `ingredients` — Ingredient catalog
- `recipe_ingredients` — Many-to-many link
- `meal_plans` — Weekly meal plans
- `shopping_lists` — Generated shopping lists
- `users` — User accounts
