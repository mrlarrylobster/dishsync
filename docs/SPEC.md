# DishPair — Product Specification

**Version:** 1.0-MVP  
**Date:** 2026-05-02  
**Status:** Draft for Engineering Review  

---

## 1. Vision & Elevator Pitch

DishPair is a web-based meal planning application for couples (and eventually families) that turns the weekly "what's for dinner" problem into a collaborative, low-friction game. Partners independently swipe on recipe cards in a blind discovery deck. When both swipe right on the same dish, they "match." Matched dishes flow into a shared weekly calendar, and the app generates an optimized grocery list that maximizes ingredient synergy and minimizes waste.

**Core Value Proposition:** Stop negotiating dinner. Start matching on it.

---

## 2. Target User

- **Primary:** Cohabiting couples (2 people) who share cooking responsibility.
- **Secondary:** Single users who want an intelligent, swipe-based meal planner.
- **Deferred:** Families/roommates (3+ people) with majority-rule voting.

---

## 3. Functional Requirements

### 3.1 User & Couple Management

| ID | Requirement | Priority |
|----|-------------|----------|
| U-01 | Users can create an account with email/password (POC auth). | P0 |
| U-02 | Users can link with a partner via 6-digit invite code, email invite, or QR scan. | P0 |
| U-03 | A "couple" is the atomic unit. All data (pantry, calendar, grocery list) is shared at the couple level. | P0 |
| U-04 | Single-user mode is supported: swiping right immediately counts as a match. | P0 |
| U-05 | Users can set a shared profile: dietary tags (vegetarian, gluten-free, etc.), disliked ingredients, and household size. | P1 |

### 3.2 The Swipe Deck (Discovery)

| ID | Requirement | Priority |
|----|-------------|----------|
| D-01 | Each user sees a card-stack interface (mobile) or grid (desktop) of recipe cards. | P0 |
| D-02 | Swiping is **blind**: users cannot see their partner's swipe status before voting. | P0 |
| D-03 | Each card shows: hero image, dish name, total time, active time, key ingredients, and a "synergy score" (how well it fits current pantry). | P0 |
| D-04 | Users can swipe left (pass) or right (interested). | P0 |
| D-05 | A "match reveal" occurs when both partners swipe right on the same dish. Both receive a notification (in-app + email). | P0 |
| D-06 | Matched dishes appear in a "Matches" holding area before scheduling. | P0 |
| D-07 | Passed dishes are removed from the user's deck but may reappear after 30 days if pantry conditions change. | P2 |

### 3.3 Time Filtering & The "Stretch"

| ID | Requirement | Priority |
|----|-------------|----------|
| T-01 | Couples set a **shared weekly time budget** via a single slider (e.g., 15–120 min). This is a pre-commitment filter. | P0 |
| T-02 | The swipe deck is filtered by this time budget by default. | P0 |
| T-03 | When the deck is exhausted for the current budget, the app silently relaxes the threshold in 15-minute increments. | P0 |
| T-04 | "Stretch" dishes (over budget) are visually flagged with a subtle badge: *"+X min stretch"* and a contextual reason (e.g., *"Uses your dying basil"*). | P0 |
| T-05 | The time budget can be renegotiated weekly. The app suggests last week's budget as the default. | P1 |
| T-06 | Users can specify "active time" vs. "total time" preference. Passive oven time does not count toward the budget. | P2 |

### 3.4 Calendar & Scheduling

| ID | Requirement | Priority |
|----|-------------|----------|
| C-01 | A weekly calendar view shows a single "Dinner" row (Monday–Sunday). | P0 |
| C-02 | Users can drag matched dishes from the "Matches" holding area onto specific days. | P0 |
| C-03 | An **Auto-Schedule** button places matched dishes intelligently across the week. | P0 |
| C-04 | The scheduling algorithm optimizes for: (1) ingredient synergy across adjacent days, (2) perishability sequencing (fragile ingredients earlier), (3) respect for time budget. | P0 |
| C-05 | Users can remove a dish from the calendar. This triggers a **bilateral veto**: the removal is flagged as pending until the partner approves or a 24-hour timeout auto-confirms. | P0 |
| C-06 | When a dish is removed post-grocery-shopping, the app suggests "rescue recipes" that use the already-purchased orphaned ingredients, requiring no new groceries. | P1 |
| C-07 | When a dish is removed pre-grocery-shopping, the app tentatively recalculates the schedule and grocery list, showing the draft to both partners. | P1 |

### 3.5 Pantry & Inventory

| ID | Requirement | Priority |
|----|-------------|----------|
| P-01 | Users can manually populate their "Fridge" / pantry during onboarding with a quick-add interface (staples + perishables with purchase/expiration dates). | P0 |
| P-02 | The pantry uses a **probabilistic model**: each ingredient has `quantity`, `confidence` (0.0–1.0), `last_verified`, and `decay_rate`. | P0 |
| P-03 | **Passive Inference (Grocery List Delta):** If the app suggests an ingredient on the grocery list and the user does NOT check it off, confidence increases. If the user checks it off, it is added to the pantry. After a recipe is marked "cooked," ingredients are decremented. | P0 |
| P-04 | **Perishable Decay:** Confidence auto-decays based on ingredient category (herbs: -20%/day, dairy: -10%/day, dry staples: -1%/day). | P0 |
| P-05 | When confidence on a perishable drops below 0.5, the app aggressively surfaces "ingredient-killer" recipes to use it before it spoils. | P1 |
| P-06 | The system pre-computes **ingredient substitution cascades** for low-confidence items (e.g., if crème fraîche is uncertain, fallback to sour cream + lemon). | P2 |
| P-07 | If a user manually adds an ingredient that the system thought they had (phantom ingredient), the system logs the failure and downweights the inference rule. | P2 |

### 3.6 Grocery List

| ID | Requirement | Priority |
|----|-------------|----------|
| G-01 | The grocery list aggregates all ingredients from scheduled dishes, subtracts pantry inventory (by confidence threshold). | P0 |
| G-02 | Ingredients are grouped by category (Produce, Dairy, Meat, Dry Goods, etc.). | P0 |
| G-03 | The list is exportable as plain text (copy to clipboard) and shareable. | P0 |
| G-04 | Each item shows its source recipe(s) so users understand why it is needed. | P1 |
| G-05 | Users can manually add/remove items from the grocery list. Changes feed back into the pantry inference engine. | P1 |
| G-06 | Integration with Instacart/Kroger/Amazon Fresh APIs is deferred to v2. | P2 |

### 3.7 Notifications

| ID | Requirement | Priority |
|----|-------------|----------|
| N-01 | **In-app toast notifications** for: match reveals, pending vetos, dying ingredients, and weekly budget reminders. | P0 |
| N-02 | **Email fallback** for: match reveals, veto requests requiring partner action, and weekly meal-plan ready summaries. | P0 |
| N-03 | Push notifications (PWA) deferred to Phase 2. | P2 |
| N-04 | A "notification preferences" panel lets users mute non-urgent alerts. | P1 |

---

## 4. User Flows

### 4.1 Onboarding Flow

1. User lands on marketing page → clicks "Get Started."
2. Creates account (email/password, POC level).
3. Invites partner via 6-digit code, email, or QR.
4. **Couple Setup Screen:**
   - Set shared time budget slider.
   - Set dietary restrictions (multi-select).
   - Set disliked ingredients (free text, normalized).
   - Quick-add pantry items (photo upload deferred; manual entry only).
5. Both partners land on the Swipe Deck.

### 4.2 Weekly Ritual Flow

1. **Monday Morning:** App prompts "Renegotiate time budget?" (one-tap to keep last week's).
2. Both partners independently swipe through the deck during the week.
3. **Match Reveal:** When both swipe right, both get a notification. Dish appears in "Matches."
4. **Scheduling:** User drags matches to calendar or clicks "Auto-Schedule."
5. **Grocery Generation:** Once schedule is locked (or pre-shop), app generates grocery list.
6. **Shopping:** User checks off items. Unchecked items boost pantry confidence.
7. **Cooking:** User marks dish as "cooked." Ingredients are consumed. Pantry updates.
8. **Leftover Inference:** If recipe generates leftovers (e.g., half a roast chicken), user can one-tap log remaining quantity.

### 4.3 Veto / Unschedule Flow

1. Partner A removes Thursday's dish from the calendar.
2. System enters **pending state**. Partner B receives email + in-app notification.
3. **Pre-shop:** Tentative replacement is calculated. Partner B sees draft with ingredient consequences.
4. **Post-shop:** App suggests rescue recipes using orphaned ingredients.
5. If Partner B does not respond within 24 hours, removal auto-confirms.

---

## 5. Design System

### 5.1 Visual Direction

- **Reference:** Yummly (food-forward card layouts) but warmer, more human, and playful.
- **Tone:** Happy, engaging, relationship-affirming. The app should feel like a shared toy, not a productivity tool.
- **Playfulness:** Micro-interactions on swipe (gentle haptics via JS), celebratory match animations, warm color accents. Not emoji-heavy; use subtle illustrations or color psychology instead.
- **Attention to Detail:** Cards should have soft shadows, rounded corners (16px), and generous whitespace. Typography should feel editorial for recipe titles and utilitarian for metadata.

### 5.2 Color Palette

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--bg-primary` | `#FFFBF7` (warm off-white) | `#1A1A1A` (soft black) |
| `--bg-card` | `#FFFFFF` | `#2D2D2D` |
| `--accent-primary` | `#FF6B4A` (coral/orange — appetite, warmth) | `#FF8A6C` |
| `--accent-secondary` | `#4ECDC4` (mint — fresh, healthy) | `#6EDDD6` |
| `--accent-match` | `#FFD93D` (golden yellow — match celebration) | `#FFE066` |
| `--text-primary` | `#2D2D2D` | `#F5F5F5` |
| `--text-secondary` | `#8C8C8C` | `#A0A0A0` |
| `--success` | `#6BCB77` | `#7DD88A` |
| `--warning` | `#FFB347` | `#FFC870` |

### 5.3 Typography

- **Headings:** Inter or Plus Jakarta Sans (clean, modern, friendly).
- **Body:** Inter (high readability).
- **Recipe Titles:** 24px / 700 (mobile), 28px / 700 (desktop).
- **Metadata (time, ingredients):** 14px / 500.

### 5.4 Components

- **Recipe Card:** Full-bleed hero image (aspect 4:5), gradient overlay for text, floating action buttons (heart/pass) at bottom.
- **Match Reveal Modal:** Confetti-like micro-animation (CSS), both partner avatars, CTA to "Add to Calendar."
- **Calendar Strip:** Horizontal scroll on mobile, grid on desktop. Days show a small thumbnail of scheduled dish.
- **Grocery List:** Checklist with collapsible categories, swipe-to-check on mobile.
- **Pantry Manager:** Tag-based input with decay indicators (color-coded freshness rings).

### 5.5 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| `< 640px` | Single-column card stack (Tinder-style), bottom nav |
| `640px – 1024px` | Two-column grid (swipe + matches sidebar), persistent nav |
| `> 1024px` | Three-column layout (deck | calendar preview | pantry/grocery), top nav |

---

## 6. Technical Architecture

### 6.1 Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui | Mobile-first, PWA-ready, excellent DX |
| **Backend** | Python + FastAPI | Async-native, excellent for ML/data pipelines, user preference |
| **Database** | SQLite (MVP) → PostgreSQL (production) | SQLite for zero-config MVP; migrate to Supabase/PostgreSQL at scale |
| **ORM** | SQLAlchemy 2.0 + Alembic | Mature, async support, migration tooling |
| **Recipe API** | Spoonacular (MVP) | Structured ingredient data, cost estimates, 150 free points/day |
| **Cache** | Redis (via Docker) | Recipe metadata cache, request coalescing, session store |
| **Auth** | Custom JWT (POC) | Simple email/password + bcrypt; replace with OAuth/Supabase Auth at v2 |
| **Task Queue** | Celery + Redis (or FastAPI BackgroundTasks for MVP) | Scheduling algo, pantry decay jobs, email dispatch, deck pre-fetch |
| **Email** | Resend / SendGrid | Transactional emails for matches and vetos |
| **File Storage** | Local disk (MVP) → S3/MinIO (v2) | Recipe images cached locally; user uploads |
| **Deployment** | Docker + Docker Compose (MVP) | Single-command local dev; easy migration to VPS/K8s |

### 6.2 System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Swipe Deck  │  │   Calendar   │  │  Grocery / Pantry │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / REST + WebSocket (matches)
┌──────────────────────────▼──────────────────────────────────┐
│                    FastAPI (Python)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Auth Router │  │ Recipe Router│  │  Couple Router   │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Pantry Logic │  │ Scheduler    │  │  Notification  │   │
│  │ (Probabilistic)│  │ (Optimizer)  │  │  (Email/WS)    │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │ Recipe Cache │  │  Ingredient  │                          │
│  │   Manager    │  │ Normalizer   │                          │
│  └──────────────┘  └──────────────┘                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   SQLite     │  │    Redis     │  │   Spoonacular    │   │
│  │  (SQLAlchemy)│  │  (Cache/Jobs)│  │     API          │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│  ┌──────────────┐                                            │
│  │  Local Disk  │  ← Cached recipe images (hero + ingredient) │
│  │  (Images)    │                                            │
│  └──────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Real-Time Strategy

- **Match Reveals:** Use WebSocket (FastAPI + `python-socketio`) for instant match notifications. Fallback to polling every 30s if WebSocket fails.
- **Veto States:** WebSocket broadcast to both partners when a calendar change is proposed.
- **Other Data:** Standard REST API with optimistic UI updates on the frontend.

---

## 7. Recipe Data Pipeline

### 7.1 Primary Source: Spoonacular API (MVP)

| Aspect | Detail |
|--------|--------|
| **API** | Spoonacular Food API |
| **Why** | Structured ingredient lists with canonical names, standardized units, nutrition data, cost estimates, cuisine tags, and hero images. Critical for your synergy engine and swipe deck visuals. |
| **Free Tier** | 150 points/day |
| **Paid Tier** | $29/month for 5,000 points/day |
| **Key Endpoints** | `GET /recipes/complexSearch` (with `fillIngredients=true`), `GET /recipes/{id}/information` |

### 7.2 Point Cost Breakdown

| Endpoint | Points | DishPair Usage |
|----------|--------|----------------|
| `GET /recipes/complexSearch` (with `fillIngredients=true`) | ~2–5 pts | Deck generation (1 call per deck) |
| `GET /recipes/{id}/information` | ~1 pt | Recipe detail view (on match or schedule) |
| `GET /recipes/{id}/ingredientWidget` | ~1 pt | Ingredient list (if not cached) |
| Image fetch (CDN URL) | 0 pts | HTTP GET to Spoonacular CDN |

### 7.3 Capacity Planning

**With aggressive caching (the MVP target):**
- 1 deck generation per couple per day = ~5 pts
- 5 match detail views per couple per week = ~5 pts
- **~10 pts/day per active couple**
- **Free tier supports ~15 active couples**
- **Paid tier ($29/mo) supports ~500 active couples**

**Without caching:**
- Every page load, every swipe, every refresh = fresh API call
- **Free tier exhausted by 9 AM on a Monday with 10 couples**

### 7.4 Data Flow

```
Spoonacular API → FastAPI Backend → Normalize/Canonicalize → SQLite Cache → Next.js Deck
                                      ↓
                              Download & Cache Images
                              (hero image + ingredient thumbs)
```

### 7.5 Caching Strategy (Critical for Rate Limits)

- **Recipe Metadata Cache (Redis/SQLite):** Recipe title, time, ingredients (normalized), tags cached for 30 days. Ingredients and instructions rarely change.
- **Search Cache (Redis):** User-specific deck queries cached for 6 hours. If two users with the same dietary profile request "Thai, 30min, vegan," serve the cached result.
- **Image Cache (Local Disk → S3):** On first fetch, the backend downloads the hero image and stores it locally (MVP) or in S3 (later). All subsequent requests serve from your own domain. Spoonacular image CDN URLs are never exposed to the client.
- **Deck Pre-fetch (Celery):** Generate tomorrow's deck for all active users at 3 AM (when rate limits reset) rather than on-demand.

### 7.6 Image Handling

**What Spoonacular Provides:**
- **Recipe hero image:** Single main image per recipe (e.g., `https://spoonacular.com/recipeImages/12345-556x370.jpg`)
- **Ingredient thumbnails:** Small images for each ingredient (e.g., `basil.jpg`)

**DishPair Image Strategy:**

| Concern | Solution |
|--------|----------|
| **API key exposure** | Never serve Spoonacular image URLs directly from the client. Proxy all images through your backend (`/api/recipes/{id}/image`) so your API key stays hidden. |
| **Performance** | Cache images aggressively. Spoonacular images are static and rarely change. Store them in local disk (MVP) or S3/MinIO (v2) after first fetch. |
| **Rate limits** | Image fetches from their CDN do not count toward API points, but you should still proxy to avoid hotlinking and to enable your own CDN. |
| **Broken/missing images** | Some recipes have no image or low-quality images. Build a fallback: generative gradient card with dish name and cuisine-tag icon. |

**Image Storage Model:**

```python
class Recipe:
    spoonacular_id: int
    title: str
    image_url: str        # Spoonacular original (backup reference)
    image_local_path: str # Your cached/proxied copy (served to clients)
    # ... rest of skeleton
```

### 7.7 Ingredient Normalization

Spoonacular returns ingredients like `"2 cups of fresh basil leaves, roughly chopped"`. Your backend must parse this into:

```json
{
  "canonical_name": "basil",
  "original_name": "fresh basil leaves, roughly chopped",
  "quantity": 2,
  "unit": "cup",
  "category": "produce",
  "is_perishable": true,
  "shelf_life_days": 4
}
```

**Hybrid Parsing Approach:**

1. **Spoonacular's `aisle` field** maps to category (e.g., `"Produce"` → `produce`).
2. **A custom alias map** handles variants (`"basil leaves"` → `"basil"`, `"crème fraîche"` → `"creme_fraiche"`).
3. **A perishable lookup table** assigns decay rates by category:
   - Herbs: 3–4 days (accelerated decay, -20%/day)
   - Produce: 4–7 days
   - Dairy: 7–14 days
   - Meat: 2–3 days
   - Dry goods: 90+ days (-1%/day)

### 7.8 Rate Limit Protection

- **Request Coalescing:** If 5 users request the same search simultaneously, only 1 API call is made; the other 4 wait for the cached result.
- **Deck Pre-fetch:** Generate tomorrow's deck for all active users at 3 AM (background job) when rate limits reset, rather than on-demand.
- **Circuit Breaker:** If Spoonacular returns 429 (rate limit), serve from cache only. If cache miss, show a "Deck refreshing, check back in 10 minutes" state.
- **Point Budget Monitor:** Daily job logs remaining points. Alert admin when < 20% remaining.

### 7.9 Recipe Storage Policy (What We Store vs. Fetch)

**Permanently Stored in SQLite (our data):**
- `spoonacular_id`, `title`, `image_local_path`
- Normalized ingredients (canonical names, quantities, categories, perishability)
- `tags`, `total_time_minutes`, `active_time_minutes`
- `source_url` (attribution link)

**Fetched On-Demand (24h ephemeral cache):**
- Full step-by-step instructions (cooking directions)
- Raw ingredient strings (for display variety)
- Nutrition data (if needed later)

**Why this split:**
- Our algorithm (synergy, scheduling, grocery lists) only needs the skeleton (ingredients + time).
- Spoonacular ToS encourages driving traffic back for the full recipe experience.
- If the API goes down or we hit rate limits, users can still swipe, match, schedule, and shop. They just can't see "how to cook it" until the API recovers or we swap sources.

### 7.10 Attribution & Legal

- Spoonacular requires attribution: `"Powered by Spoonacular"` on recipe detail views.
- Do **not** store full recipe instructions long-term unless compliant with their ToS.
- All recipe data proxied through backend. No client-side API key exposure.

### 7.11 Deferred Sources (Post-MVP)

- **Blog Scraping:** Legal risk (robots.txt, copyright, structured data inconsistency). Only consider after MVP with a parser pipeline (Scrapy + recipe-schema-parser).
- **User-Generated Recipes:** Needs moderation, image upload, ingredient parsing UI, and community voting. High complexity, low MVP value.
- **Additional APIs:** Edamam, Tasty, or direct publisher partnerships evaluated at v1.2.

---

## 8. Data Model

### 8.1 Core Entities

```python
# Simplified SQLAlchemy-style pseudocode

class User:
    id: UUID
    email: str
    hashed_password: str
    display_name: str
    created_at: datetime
    # No individual pantry/calendar. All couple-level.

class Couple:
    id: UUID
    partner_1_id: UUID → User
    partner_2_id: UUID → User  # nullable for single-user mode
    invite_code: str  # 6-digit alphanumeric
    time_budget_minutes: int  # shared slider
    dietary_restrictions: list[str]  # JSON
    disliked_ingredients: list[str]  # JSON
    created_at: datetime

class Recipe:
    id: UUID
    spoonacular_id: int  # or internal ID for user-generated (v2)
    title: str
    description: str
    image_url: str        # Spoonacular original (backup)
    image_local_path: str # Cached local/S3 copy (served to clients)
    total_time_minutes: int
    active_time_minutes: int
    ingredients: list[RecipeIngredient]  # JSON/normalized
    instructions: list[str]  # JSON (ephemeral, 24h cache only)
    tags: list[str]  # e.g., ["thai", "spicy", "weeknight"]
    source_url: str  # attribution
    cached_at: datetime

class RecipeIngredient:
    # Embedded in Recipe or separate table
    name: str  # canonical name
    original_name: str  # raw name from Spoonacular (for display)
    quantity: float
    unit: str
    category: str  # produce, dairy, meat, dry_goods, etc.
    is_perishable: bool
    shelf_life_days: int  # for decay modeling

class Swipe:
    id: UUID
    user_id: UUID → User
    recipe_id: UUID → Recipe
    direction: enum("left", "right")
    created_at: datetime
    # Unique constraint on (user_id, recipe_id)

class Match:
    id: UUID
    couple_id: UUID → Couple
    recipe_id: UUID → Recipe
    partner_1_swipe_id: UUID → Swipe
    partner_2_swipe_id: UUID → Swipe
    status: enum("pending", "scheduled", "cooked", "removed")
    matched_at: datetime

class WeeklyCalendar:
    id: UUID
    couple_id: UUID → Couple
    week_start: date  # Monday
    # Days stored as JSON or separate rows
    monday_match_id: UUID → Match (nullable)
    tuesday_match_id: UUID → Match (nullable)
    ... sunday_match_id
    is_locked: bool  # post-grocery-shop freeze
    created_at: datetime

class PantryItem:
    id: UUID
    couple_id: UUID → Couple
    ingredient_name: str  # canonical
    quantity: float
    unit: str
    confidence: float  # 0.0 – 1.0
    last_verified: datetime
    decay_rate: float  # per day, e.g., 0.20 for herbs
    category: str
    is_perishable: bool
    source: enum("manual", "inferred_grocery", "inferred_cooking")

class GroceryList:
    id: UUID
    couple_id: UUID → Couple
    week_start: date
    items: list[GroceryItem]  # JSON or relation
    is_shopped: bool
    created_at: datetime

class GroceryItem:
    id: UUID
    grocery_list_id: UUID → GroceryList
    ingredient_name: str
    quantity: float
    unit: str
    category: str
    source_recipe_ids: list[UUID]  # why it's needed
    is_checked: bool
    is_substitution: bool  # if it replaced a low-confidence pantry item
    substitution_reason: str  # e.g., "crème fraîche uncertain"

class VetoRequest:
    id: UUID
    couple_id: UUID → Couple
    requesting_partner_id: UUID → User
    calendar_id: UUID → WeeklyCalendar
    day: enum("monday"..."sunday")
    proposed_replacement_match_id: UUID → Match (nullable)
    status: enum("pending", "approved", "rejected", "auto_approved")
    created_at: datetime
    resolved_at: datetime (nullable)
```

### 8.2 Key Indexes

- `Swipe`: Composite index on `(user_id, recipe_id)` for uniqueness.
- `PantryItem`: Composite index on `(couple_id, ingredient_name)` for fast lookups.
- `Match`: Index on `(couple_id, status)` for active match queries.
- `VetoRequest`: Index on `(couple_id, status)` for pending veto dashboards.
- `Recipe`: Index on `(spoonacular_id)` for deduplication; index on `(cached_at)` for cache eviction.

---

## 9. Algorithm Specifications

### 9.1 The Scheduling Engine (Auto-Schedule)

**Input:** List of matched recipes (N ≤ 7), couple's time budget, current pantry state.  
**Output:** Assignment of recipes to days (Mon–Sun) or null if impossible.

**Objective Function (weighted multi-objective):**

```
Score(assignment) = 
    w1 * IngredientSynergy(assignment)
  + w2 * PerishabilitySequencing(assignment)
  + w3 * TimeBudgetCompliance(assignment)
  + w4 * PalateVariation(assignment)
```

Where:
- `w1 = 0.35` (primary: minimize unique grocery items)
- `w2 = 0.30` (secondary: use fragile ingredients early)
- `w3 = 0.25` (tertiary: respect time budget)
- `w4 = 0.10` (quaternary: avoid back-to-back same cuisine)

**Ingredient Synergy:**  
For each pair of adjacent days (Mon-Tue, Tue-Wed, etc.), compute Jaccard similarity of ingredient sets. Higher overlap = lower grocery cost. Reward assignments that cluster recipes sharing staples (garlic, onions, herbs, proteins).

**Perishability Sequencing:**  
Each recipe gets a "fragility score" = max(shelf_life_days of its perishable ingredients). Sort descending fragility: most fragile dishes scheduled earliest in the week.

**Time Budget Compliance:**  
If `active_time > budget`, apply a penalty proportional to the overrun. Stretch dishes incur 2x penalty but are allowed if no valid assignment exists under strict budget.

**Palate Variation:**  
Penalize adjacent days with shared cuisine tags ("thai" → "thai" = -10 points).

**Implementation:**  
For MVP, use a greedy heuristic with backtracking (not full combinatorial optimization). If N ≤ 7, brute-force is acceptable (7! = 5040 permutations). Run in a FastAPI background task or Celery worker.

### 9.2 The Pantry Inference Engine

**State Update Rules:**

1. **Grocery List Generation (Pre-Shop):**
   - For each ingredient in scheduled recipes:
     - If `pantry.confidence > 0.7` and `pantry.quantity ≥ required`: omit from grocery list.
     - If `0.4 < pantry.confidence ≤ 0.7`: add to grocery list with a "maybe have" flag and pre-compute substitution.
     - If `pantry.confidence ≤ 0.4`: add to grocery list normally.

2. **Shopping Event:**
   - User checks off `GroceryItem.is_checked = True`.
   - System adds/updates `PantryItem` with `source = "inferred_grocery"`, `confidence = 0.95`, `last_verified = now()`.
   - User does NOT check off an item: `PantryItem.confidence += 0.15` (capped at 0.95).

3. **Cooking Event:**
   - User marks `Match.status = "cooked"`.
   - System decrements `PantryItem.quantity` by recipe amount.
   - If `quantity ≤ 0`, set `confidence = 0.0`.
   - If recipe generates leftovers (e.g., "half a roast chicken"), user can one-tap log it → new `PantryItem` with `source = "manual"`.

4. **Decay Cron (Daily at 4 AM):**
   ```python
   for item in pantry:
       if item.is_perishable:
           item.confidence -= item.decay_rate
           item.confidence = max(0.0, item.confidence)
   ```

5. **Phantom Detection:**
   - If a recipe is cooked and the user manually added an ingredient to the grocery list that the system thought they had (high confidence, but user bought it anyway):
   - Log as `PhantomEvent(ingredient, expected_confidence, recipe)`.
   - If phantom rate for an ingredient > 30% over 4 weeks, disable passive inference for that ingredient class and default to grocery-list inclusion.

### 9.3 The Recommendation Engine (Swipe Deck)

**Filtering Pipeline (in order):**

1. **Hard Filters:**
   - Dietary restrictions (vegan, GF, etc.)
   - Disliked ingredients
   - Time budget (+ stretch threshold if needed)
   - Already swiped (left or right) in last 30 days

2. **Scoring Layer:**
   - **Pantry Synergy Boost:** +score for recipes using high-confidence pantry items, especially decaying ones.
   - **Novelty Boost:** Slightly favor recipes not cooked in last 8 weeks.
   - **Match Probability:** If partner has already swiped right, prioritize showing this recipe to the other partner (increases match rate, drives engagement).

3. **Deduplication:**
   - Ensure no two cards in the same deck share > 80% ingredient overlap (variety enforcement).

**Deck Size:** 20–30 cards per session. Refresh daily.

---

## 10. API Design (REST + WebSocket)

### 10.1 REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get JWT token |
| POST | `/couples` | Create couple + generate invite code |
| POST | `/couples/join` | Join couple via invite code |
| GET | `/couples/me` | Get current couple profile |
| PATCH | `/couples/me` | Update time budget, dietary prefs |
| GET | `/recipes/feed` | Get personalized swipe deck (paginated) |
| GET | `/recipes/{id}` | Get recipe details (proxies Spoonacular if needed) |
| GET | `/recipes/{id}/image` | Proxy recipe image (no API key exposure) |
| POST | `/swipes` | Record a swipe |
| GET | `/matches` | Get all matches for couple |
| POST | `/matches/{id}/schedule` | Schedule a match to a day |
| POST | `/calendar/auto-schedule` | Run scheduling algorithm |
| GET | `/calendar/current` | Get current week's calendar |
| DELETE | `/calendar/{day}` | Request removal (creates VetoRequest) |
| POST | `/vetos/{id}/resolve` | Approve/reject a veto |
| GET | `/pantry` | Get probabilistic pantry |
| POST | `/pantry` | Add/update pantry items |
| GET | `/grocery/current` | Get current grocery list |
| POST | `/grocery/check` | Check off grocery items |
| GET | `/grocery/export` | Plain text export |

### 10.2 WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `match.revealed` | Server → Client | `{ match_id, recipe, partner_name }` |
| `veto.proposed` | Server → Client | `{ veto_id, day, requesting_partner, proposed_replacement }` |
| `veto.resolved` | Server → Client | `{ veto_id, status, new_calendar }` |
| `pantry.alert` | Server → Client | `{ ingredient, confidence, suggested_recipes[] }` |

---

## 11. MVP Scope & Phasing

### 11.1 In Scope (P0 – Must Have)

- [x] Web-only, mobile-first responsive, PWA-ready
- [x] Email/password POC auth
- [x] Couple creation & linking (invite code/email/QR)
- [x] Blind swipe deck with match reveals
- [x] Shared time budget slider + stretch logic
- [x] Weekly calendar (dinner row) with drag-and-drop scheduling
- [x] Auto-schedule algorithm (synergy + perishability)
- [x] Bilateral veto system with 24h auto-approve
- [x] Probabilistic pantry (manual input + passive inference)
- [x] Perishable decay tracking
- [x] Grocery list generation (pantry subtraction)
- [x] Plain text grocery export
- [x] In-app notifications + email fallback
- [x] Spoonacular API integration with caching, normalization, and image proxy
- [x] Single-user mode (auto-match on right swipe)
- [x] Recipe image caching (hero images stored locally, served via proxy)
- [x] Ingredient normalization pipeline (canonical names, perishability mapping)

### 11.2 Out of Scope (P2 – Post-MVP)

- [ ] Community recipe creation/upload
- [ ] AI photo scanning of fridge
- [ ] Barcode scanning
- [ ] Grocery API integration (Instacart, etc.)
- [ ] Weekend vs. weekday time budgets
- [ ] Flex tokens for unilateral swaps
- [ ] Push notifications (PWA native)
- [ ] External calendar sync (Google/Apple)
- [ ] Social features (share matches, leaderboards)
- [ ] Nutrition tracking / calorie counting
- [ ] Leftover inference automation (manual one-tap only in MVP)
- [ ] Full recipe instruction long-term storage (fetched on-demand only)

### 11.3 Phase 2 (v1.1 – v1.3) Roadmap

1. **v1.1 — Pantry Intelligence:** AI photo scan, barcode scan, advanced passive inference.
2. **v1.2 — Commerce & Scale:** Grocery API integration, one-click ordering, cost optimization, paid Spoonacular tier, additional recipe sources.
3. **v1.3 — Social & Family:** Community recipes, family mode (3+ people), public recipe decks, nutrition tracking.

---

## 12. Non-Functional Requirements

### 12.1 Performance

- Swipe deck load time: < 500ms on 4G.
- Match reveal latency: < 200ms (WebSocket).
- Auto-schedule computation: < 2s for 7 dishes.
- Grocery list generation: < 500ms.
- Image proxy response: < 300ms (with local cache hit).

### 12.2 Security

- JWT tokens with 7-day expiry, refresh token rotation.
- All couple data is isolated by `couple_id` (row-level security pattern).
- Recipe images proxied through backend to avoid mixed-content and attribution leaks.
- Spoonacular API key never exposed to client.
- Passwords hashed with bcrypt (cost factor 12).

### 12.3 Privacy

- No third-party tracking pixels.
- Recipe preference data stays within the couple's data boundary.
- Spoonacular API calls proxied through backend (no client-side API keys).

### 12.4 Accessibility

- WCAG 2.1 AA compliance target.
- Swipe gestures have keyboard/tap alternatives.
- Color contrast ratios ≥ 4.5:1 for all text.
- Screen reader labels for all interactive elements.

---

## 13. Open Questions & Risks

| Risk | Mitigation | Owner |
|------|-----------|-------|
| **Spoonacular rate limits** (150 pts/day free) | Cache aggressively; request coalescing; deck pre-fetch at 3 AM; budget for paid tier ($29/mo) at 20+ couples. | Backend |
| **Pantry inference accuracy** | Start conservative (high confidence thresholds); collect phantom event data; tune decay rates weekly. | Data/ML |
| **Couple conflict over time budget** | Add "budget history" to show compromise patterns; consider flex tokens in v1.2. | Product |
| **Recipe copyright / scraping** | Stay within Spoonacular ToS; no blog scraping in MVP; user-generated content needs moderation pipeline. | Legal/Product |
| **WebSocket reliability on mobile** | Implement robust fallback to polling; use Socket.IO with reconnection logic. | Frontend |
| **SQLite concurrency under couple load** | SQLite is fine for MVP (< 1000 couples); monitor WAL mode performance; migrate to PostgreSQL if write contention appears. | Backend |
| **Single-user engagement drop-off** | Manufacture "match moments" (e.g., "Future You agrees!" animation) to preserve dopamine loop. | Design |
| **Ingredient normalization edge cases** | Build alias map iteratively; log unrecognized ingredients for manual review. | Backend |
| **Image storage growth** | Local disk sufficient for MVP (~10MB per 1000 recipes); migrate to S3 when storage > 5GB. | Backend/DevOps |

---

## 14. Success Metrics (MVP)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Weekly Active Couples (WAC) | 50% of registered couples use app 2+ times/week | Backend analytics |
| Swipe-to-Match Rate | > 15% of right swipes result in mutual matches | Swipe table analysis |
| Schedule Completion Rate | > 70% of matched dishes get scheduled | Match status tracking |
| Grocery List Adoption | > 60% of couples generate and view a grocery list weekly | Grocery list events |
| Veto Resolution Time | < 6 hours median | VetoRequest timestamps |
| Pantry Accuracy (Phantom Rate) | < 25% phantom rate by week 4 | PhantomEvent logging |
| Recipe API Cache Hit Rate | > 80% | Redis metrics |
| Image Cache Hit Rate | > 95% | Nginx/local disk metrics |

---

## 15. Glossary

- **Match:** A recipe both partners swiped right on.
- **Stretch Dish:** A recipe slightly over the shared time budget, surfaced when the deck is exhausted.
- **Phantom Ingredient:** An ingredient the system believed the user had (high confidence), but the user actually lacked.
- **Probabilistic Pantry:** A pantry model where each item has a confidence score (0.0–1.0) rather than a binary present/absent state.
- **Passive Inference:** Deducing pantry contents from grocery list behavior (unchecked items = likely owned) and cooking events.
- **Bilateral Veto:** A calendar change that requires both partners' approval (or auto-approves after timeout).
- **Request Coalescing:** Combining simultaneous identical API requests into a single upstream call to protect rate limits.
- **Ingredient Normalization:** Parsing raw recipe strings into canonical, structured ingredient records.
- **Skeleton Storage:** Storing only recipe metadata and ingredients (not full instructions) to stay API-compliant while enabling algorithmic features.

---

*End of Specification*
