# Current Open Questions (2026-05-03)

## From David
- **Don't implement yet** — spec review + Q&A phase first

## From Larry (for David to answer)

### 1. Repo / Product Name
The spec says **DishPair**, but the repo is `dishsync`. Should I rename the repo to `dishpair`, or keep `dishsync` as the working name?

### 2. Spoonacular API Key
The spec requires Spoonacular for recipe data. Do you have an API key, or should I mock recipe data for initial development? The free tier (150 pts/day) supports ~15 active couples — fine for MVP testing but we'll need the $29/mo paid tier once we have real users.

### 3. Frontend Stack
Spec says **Next.js 14 (App Router)** for the frontend. Current repo uses **Vite + React**. Should I:
- (a) Migrate to Next.js now (more work upfront, better PWA/SSR support)
- (b) Stick with Vite + React (faster iteration, can migrate later)

### 4. Single-User vs Couple-First
The spec says single-user mode is P0 (auto-match on right swipe), but the core value prop is couples matching. Which should I build first:
- (a) Single-user mode first (simpler, no WebSocket needed)
- (b) Two-player mode first (the real differentiator)
- (c) Both in parallel (more complex but complete)

### 5. Recipe Image Strategy
Spec says proxy all images through backend to hide API key. Spoonacular image CDN URLs don't cost points. For MVP, should I:
- (a) Build the image proxy now (adds complexity, but spec-compliant)
- (b) Serve Spoonacular CDN URLs directly in frontend (simpler, images are free)
- (c) Mock images for now (placeholder gradients / cuisine icons)

---
*Waiting for David's answers before proceeding with implementation.*
