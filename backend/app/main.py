from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session, joinedload
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, date
from dotenv import load_dotenv
import os
import uuid
import secrets
import httpx
import asyncio

# Load .env from backend directory
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
load_dotenv(env_path)

from app.db import get_db, init_db
from app.models import User, Couple, Recipe, RecipeIngredient, Swipe, Match, WeeklyCalendar, PantryItem, GroceryList, GroceryItem, VetoRequest
from app.schemas import (
    UserRegister, UserLogin, UserRead, CoupleCreate, CoupleJoin, CoupleRead,
    CoupleUpdate, RecipeRead, RecipeIngredientRead, SwipeCreate, SwipeRead,
    MatchRead, ScheduleMatch, WeeklyCalendarRead, PantryItemCreate, PantryItemRead,
    GroceryListRead, GroceryItemRead, GroceryCheckItem, VetoResolve
)

# ─── Config ───
SECRET_KEY = os.environ.get("JWT_SECRET", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7
SPOONACULAR_API_KEY = os.environ.get("SPOONACULAR_API_KEY", "")

# ─── Init ───
app = FastAPI(title="DishPair API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── WebSocket Connection Manager ───
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}  # couple_id -> [websockets]
    
    async def connect(self, couple_id: str, websocket: WebSocket):
        await websocket.accept()
        if couple_id not in self.active_connections:
            self.active_connections[couple_id] = []
        self.active_connections[couple_id].append(websocket)
    
    def disconnect(self, couple_id: str, websocket: WebSocket):
        if couple_id in self.active_connections:
            self.active_connections[couple_id].remove(websocket)
            if not self.active_connections[couple_id]:
                del self.active_connections[couple_id]
    
    async def broadcast_to_couple(self, couple_id: str, message: dict):
        if couple_id in self.active_connections:
            for connection in self.active_connections[couple_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass  # Connection closed

manager = ConnectionManager()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


# ─── Auth Helpers ───
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": user_id, "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_couple_for_user(user: User, db: Session) -> Couple:
    couple = db.query(Couple).filter(
        (Couple.partner_1_id == user.id) | (Couple.partner_2_id == user.id)
    ).first()
    if not couple:
        raise HTTPException(status_code=404, detail="No couple found. Create or join one first.")
    return couple


# ─── WebSocket ───
@app.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=4001)
            return
    except JWTError:
        await websocket.close(code=4001)
        return
    
    # Get user's couple
    from app.db import SessionLocal
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            await websocket.close(code=4001)
            return
        
        couple = db.query(Couple).filter(
            (Couple.partner_1_id == user.id) | (Couple.partner_2_id == user.id)
        ).first()
        
        if not couple:
            await websocket.close(code=4002)
            return
        
        couple_id = couple.id
    finally:
        db.close()
    
    await manager.connect(couple_id, websocket)
    try:
        while True:
            # Keep connection alive, listen for client pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(couple_id, websocket)


# ─── Health ───
@app.get("/health")
def health():
    return {"ok": True}


# ─── Auth ───
@app.post("/auth/register", response_model=dict)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    
    user = User(
        id=str(uuid.uuid4()),
        email=payload.email,
        hashed_password=hash_password(payload.password),
        display_name=payload.display_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_token(user.id)
    return {"token": token, "user": {"id": user.id, "email": user.email, "display_name": user.display_name}}


@app.post("/auth/login", response_model=dict)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user.id)
    return {"token": token, "user": {"id": user.id, "email": user.email, "display_name": user.display_name}}


# ─── Couple ───
@app.post("/couples", response_model=dict)
def create_couple(payload: CoupleCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(Couple).filter(
        (Couple.partner_1_id == user.id) | (Couple.partner_2_id == user.id)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="User already in a couple")
    
    invite_code = secrets.token_urlsafe(6)[:6].upper()
    couple = Couple(
        id=str(uuid.uuid4()),
        partner_1_id=user.id,
        invite_code=invite_code,
        time_budget_minutes=payload.time_budget_minutes,
        dietary_restrictions=payload.dietary_restrictions,
        disliked_ingredients=payload.disliked_ingredients,
    )
    db.add(couple)
    db.commit()
    db.refresh(couple)
    
    return {
        "id": couple.id,
        "invite_code": couple.invite_code,
        "partner_1": {"id": user.id, "email": user.email, "display_name": user.display_name},
        "time_budget_minutes": couple.time_budget_minutes,
    }


@app.post("/couples/join", response_model=dict)
def join_couple(payload: CoupleJoin, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(Couple).filter(
        (Couple.partner_1_id == user.id) | (Couple.partner_2_id == user.id)
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="User already in a couple")
    
    couple = db.query(Couple).filter(Couple.invite_code == payload.invite_code.upper()).first()
    if not couple:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    if couple.partner_2_id:
        raise HTTPException(status_code=409, detail="Couple is already full")
    
    couple.partner_2_id = user.id
    db.commit()
    db.refresh(couple)
    
    partner_1 = db.query(User).filter(User.id == couple.partner_1_id).first()
    return {
        "id": couple.id,
        "partner_1": {"id": partner_1.id, "email": partner_1.email, "display_name": partner_1.display_name},
        "partner_2": {"id": user.id, "email": user.email, "display_name": user.display_name},
        "time_budget_minutes": couple.time_budget_minutes,
    }


@app.get("/couples/me", response_model=dict)
def get_my_couple(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_couple_for_user(user, db)
    partner_1 = db.query(User).filter(User.id == couple.partner_1_id).first()
    partner_2 = db.query(User).filter(User.id == couple.partner_2_id).first() if couple.partner_2_id else None
    
    return {
        "id": couple.id,
        "invite_code": couple.invite_code,
        "partner_1": {"id": partner_1.id, "email": partner_1.email, "display_name": partner_1.display_name},
        "partner_2": {"id": partner_2.id, "email": partner_2.email, "display_name": partner_2.display_name} if partner_2 else None,
        "time_budget_minutes": couple.time_budget_minutes,
        "dietary_restrictions": couple.dietary_restrictions or [],
        "disliked_ingredients": couple.disliked_ingredients or [],
    }


@app.patch("/couples/me", response_model=dict)
def update_couple(payload: CoupleUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_couple_for_user(user, db)
    if payload.time_budget_minutes is not None:
        couple.time_budget_minutes = payload.time_budget_minutes
    if payload.dietary_restrictions is not None:
        couple.dietary_restrictions = payload.dietary_restrictions
    if payload.disliked_ingredients is not None:
        couple.disliked_ingredients = payload.disliked_ingredients
    db.commit()
    db.refresh(couple)
    return {"ok": True}


# ─── Recipes / Feed ───
def _spoonacular_to_recipe(data: dict, db: Session) -> Recipe:
    """Convert Spoonacular API response to our Recipe model."""
    recipe = Recipe(
        id=str(uuid.uuid4()),
        spoonacular_id=data["id"],
        title=data["title"],
        description=data.get("summary", "")[:500],
        image_url=data.get("image"),
        total_time_minutes=data.get("readyInMinutes", 30),
        active_time_minutes=data.get("preparationMinutes"),
        instructions=[step["step"] for step in data.get("analyzedInstructions", [{}])[0].get("steps", [])],
        tags=data.get("cuisines", []) + data.get("dishTypes", []),
        source_url=data.get("sourceUrl"),
    )
    db.add(recipe)
    db.flush()
    
    # Parse ingredients
    for ing in data.get("extendedIngredients", []):
        aisle = ing.get("aisle")
        ri = RecipeIngredient(
            id=str(uuid.uuid4()),
            recipe_id=recipe.id,
            name=ing.get("name", "unknown"),
            original_name=ing.get("originalName"),
            quantity=ing.get("amount"),
            unit=ing.get("unit"),
            category=aisle if aisle else "unknown",
            is_perishable=(aisle or "") in ["Produce", "Meat", "Seafood", "Milk, Eggs, Other Dairy"],
            shelf_life_days=7 if (aisle or "") in ["Produce"] else 14,
        )
        db.add(ri)
    
    db.commit()
    db.refresh(recipe)
    return recipe


def _recipe_to_read(recipe: Recipe) -> dict:
    return {
        "id": recipe.id,
        "spoonacular_id": recipe.spoonacular_id,
        "title": recipe.title,
        "description": recipe.description,
        "image_url": recipe.image_url,
        "total_time_minutes": recipe.total_time_minutes,
        "active_time_minutes": recipe.active_time_minutes,
        "tags": recipe.tags or [],
        "instructions": recipe.instructions or [],
        "ingredients": [
            {
                "name": i.name,
                "original_name": i.original_name,
                "quantity": i.quantity,
                "unit": i.unit,
                "category": i.category,
                "is_perishable": i.is_perishable,
                "shelf_life_days": i.shelf_life_days,
            }
            for i in recipe.ingredients
        ],
    }


# ─── Days ───
DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

# Spoonacular rate limit tracking
_last_spoonacular_error = 0
SPOONACULAR_COOLDOWN_SECONDS = 3600  # 1 hour cooldown after rate limit

@app.get("/recipes/feed")
def get_recipe_feed(
    limit: int = 20,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    couple = get_couple_for_user(user, db)
    
    # Get already swiped recipe IDs (last 30 days)
    swiped_ids = [
        s.recipe_id for s in db.query(Swipe).filter(
            Swipe.user_id == user.id,
            Swipe.created_at > datetime.utcnow() - timedelta(days=30)
        ).all()
    ]
    
    # Get already matched recipe IDs (so they don't appear again)
    matched_ids = [
        m.recipe_id for m in db.query(Match).filter(
            Match.couple_id == couple.id,
            Match.status.in_(["pending", "scheduled"])
        ).all()
    ]
    
    # Combine exclusions
    excluded_ids = list(set(swiped_ids + matched_ids))
    
    # Get from cache — random order for variety, only recipes WITH images
    from sqlalchemy import func
    base_query = db.query(Recipe).filter(Recipe.image_url.isnot(None))
    query = base_query.filter(~Recipe.id.in_(excluded_ids)) if excluded_ids else base_query
    # Fetch more than needed since budget/time filtering will drop some
    fetch_limit = limit * 5
    recipes = query.order_by(func.random()).limit(fetch_limit).offset(offset).all()
    
    # Track if we're showing recycled (previously declined) recipes
    recycled = False
    
    # If pool is exhausted, recycle left-swipes (recipes user passed on)
    if len(recipes) < limit:
        # Get left-swipe IDs to recycle
        left_swipe_ids = [
            s.recipe_id for s in db.query(Swipe).filter(
                Swipe.user_id == user.id,
                Swipe.direction == "left",
                Swipe.created_at > datetime.utcnow() - timedelta(days=30)
            ).all()
        ]
        if left_swipe_ids:
            # Exclude still-matched recipes, but allow previously left-swiped
            recycle_excluded = list(set(matched_ids))  # Don't recycle matched ones
            recycle_query = base_query.filter(~Recipe.id.in_(recycle_excluded)) if recycle_excluded else base_query
            recycle_query = recycle_query.filter(Recipe.id.in_(left_swipe_ids))
            recycled_recipes = recycle_query.order_by(func.random()).limit(limit * 5).all()
            if recycled_recipes:
                recipes = recycled_recipes
                recycled = True
    
    # Only hit Spoonacular if cache is low
    global _last_spoonacular_error
    in_cooldown = (datetime.utcnow().timestamp() - _last_spoonacular_error) < SPOONACULAR_COOLDOWN_SECONDS
    
    if len(recipes) < limit and SPOONACULAR_API_KEY and not in_cooldown:
        try:
            params = {
                "number": limit - len(recipes),
                "apiKey": SPOONACULAR_API_KEY,
                "addRecipeInformation": "true",
                "fillIngredients": "true",
            }
            if couple.dietary_restrictions:
                params["diet"] = ",".join(couple.dietary_restrictions)
            if couple.disliked_ingredients:
                params["excludeIngredients"] = ",".join(couple.disliked_ingredients)
            
            resp = httpx.get("https://api.spoonacular.com/recipes/complexSearch", params=params, timeout=30)
            
            if resp.status_code == 429:
                _last_spoonacular_error = datetime.utcnow().timestamp()
                print("Spoonacular rate limited — entering 1-hour cooldown")
            elif resp.status_code == 200:
                for r in resp.json().get("results", []):
                    existing = db.query(Recipe).filter(Recipe.spoonacular_id == r["id"]).first()
                    if not existing:
                        _spoonacular_to_recipe(r, db)
                db.commit()
                # Re-fetch
                recipes = query.order_by(func.random()).limit(limit).offset(offset).all()
            else:
                print(f"Spoonacular error: {resp.status_code} - {resp.text[:200]}")
                
        except Exception as e:
            print(f"Spoonacular fetch error: {e}")
    
    # Filter by time budget (with stretch) — up to 50% over budget shown as stretch
    budget = couple.time_budget_minutes
    result = []
    for r in recipes:
        is_stretch = r.total_time_minutes > budget
        if r.total_time_minutes <= budget * 1.5:
            result.append({
                **_recipe_to_read(r),
                "is_stretch": is_stretch,
                "stretch_minutes": max(0, r.total_time_minutes - budget) if is_stretch else 0,
            })
    
    # With 1000+ recipes, we should never need to recycle. 
    # If nothing passes budget filter, return over-budget recipes as stretch
    if len(result) == 0 and recipes:
        for r in recipes:
            result.append({
                **_recipe_to_read(r),
                "is_stretch": True,
                "stretch_minutes": r.total_time_minutes - budget,
            })
    
    return {"recipes": result[:limit], "recycled": recycled}


@app.get("/recipes/{recipe_id}")
def get_recipe_detail(recipe_id: str, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return _recipe_to_read(recipe)


# ─── Swipes ───
@app.post("/swipes")
def create_swipe(payload: SwipeCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Check if already swiped
    existing = db.query(Swipe).filter(Swipe.user_id == user.id, Swipe.recipe_id == payload.recipe_id).first()
    if existing:
        existing.direction = payload.direction
        db.commit()
        db.refresh(existing)
        return {"id": existing.id, "direction": existing.direction}
    
    swipe = Swipe(
        id=str(uuid.uuid4()),
        user_id=user.id,
        recipe_id=payload.recipe_id,
        direction=payload.direction,
    )
    db.add(swipe)
    db.commit()
    db.refresh(swipe)
    
    # Check for match (if partner also swiped right)
    couple = get_couple_for_user(user, db)
    if payload.direction == "right" and couple.partner_2_id:
        partner_id = couple.partner_1_id if couple.partner_2_id == user.id else couple.partner_2_id
        partner_swipe = db.query(Swipe).filter(
            Swipe.user_id == partner_id,
            Swipe.recipe_id == payload.recipe_id,
            Swipe.direction == "right",
        ).first()
        
        if partner_swipe:
            # Create match
            match = Match(
                id=str(uuid.uuid4()),
                couple_id=couple.id,
                recipe_id=payload.recipe_id,
                partner_1_swipe_id=swipe.id if user.id == couple.partner_1_id else partner_swipe.id,
                partner_2_swipe_id=partner_swipe.id if user.id == couple.partner_1_id else swipe.id,
                status="pending",
            )
            db.add(match)
            db.commit()
            db.refresh(match)
            
            # Broadcast match reveal to couple via WebSocket
            recipe = db.query(Recipe).filter(Recipe.id == payload.recipe_id).first()
            partner = db.query(User).filter(User.id == partner_id).first()
            asyncio.create_task(manager.broadcast_to_couple(couple.id, {
                "type": "match.revealed",
                "match_id": match.id,
                "recipe": _recipe_to_read(recipe),
                "partner_name": partner.display_name if partner else "Your partner",
            }))
            
            return {"id": swipe.id, "direction": swipe.direction, "match": {"id": match.id, "recipe_id": payload.recipe_id}}
    elif payload.direction == "right" and not couple.partner_2_id:
        # Single-user mode: auto-match
        match = Match(
            id=str(uuid.uuid4()),
            couple_id=couple.id,
            recipe_id=payload.recipe_id,
            partner_1_swipe_id=swipe.id,
            status="pending",
        )
        db.add(match)
        db.commit()
        db.refresh(match)
        return {"id": swipe.id, "direction": swipe.direction, "match": {"id": match.id, "recipe_id": payload.recipe_id}}
    
    return {"id": swipe.id, "direction": swipe.direction}


# ─── Matches ───
@app.get("/matches")
def get_matches(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_couple_for_user(user, db)
    matches = db.query(Match).options(joinedload(Match.recipe)).filter(
        Match.couple_id == couple.id,
        Match.status.in_(["pending", "scheduled"]),
    ).all()
    result = []
    for m in matches:
        if not m.recipe:
            continue  # Skip orphaned matches (recipe was deleted)
        result.append({
            "match_id": m.id,
            "status": m.status,
            **_recipe_to_read(m.recipe),
        })
    return {"matches": result}


@app.delete("/matches/{match_id}")
def delete_match(match_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a match entirely (removes from both pending and scheduled)."""
    couple = get_couple_for_user(user, db)
    match = db.query(Match).filter(Match.id == match_id, Match.couple_id == couple.id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # If scheduled, clear from calendar
    if match.status == "scheduled":
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        cal = db.query(WeeklyCalendar).filter(
            WeeklyCalendar.couple_id == couple.id,
            WeeklyCalendar.week_start == week_start,
        ).first()
        if cal:
            for day in DAYS:
                field = f"{day}_match_id"
                if getattr(cal, field) == match_id:
                    setattr(cal, field, None)
                    break
    
    db.delete(match)
    db.commit()
    
    return {"ok": True, "message": "Match deleted"}


# ─── Calendar ───
def _get_or_create_calendar(couple_id: str, week_start: date, db: Session) -> WeeklyCalendar:
    cal = db.query(WeeklyCalendar).filter(
        WeeklyCalendar.couple_id == couple_id,
        WeeklyCalendar.week_start == week_start,
    ).first()
    if not cal:
        cal = WeeklyCalendar(
            id=str(uuid.uuid4()),
            couple_id=couple_id,
            week_start=week_start,
        )
        db.add(cal)
        db.commit()
        db.refresh(cal)
    return cal


def _get_match_detail(match_id, db):
    if not match_id:
        return None
    m = db.query(Match).options(joinedload(Match.recipe)).filter(Match.id == match_id).first()
    if not m:
        return None
    return {
        "id": m.id,
        "status": m.status,
        "recipe": _recipe_to_read(m.recipe),
    }


@app.get("/calendar/current")
def get_current_calendar(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_couple_for_user(user, db)
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    cal = _get_or_create_calendar(couple.id, week_start, db)
    
    return {
        "id": cal.id,
        "week_start": str(cal.week_start),
        "monday": _get_match_detail(cal.monday_match_id, db),
        "tuesday": _get_match_detail(cal.tuesday_match_id, db),
        "wednesday": _get_match_detail(cal.wednesday_match_id, db),
        "thursday": _get_match_detail(cal.thursday_match_id, db),
        "friday": _get_match_detail(cal.friday_match_id, db),
        "saturday": _get_match_detail(cal.saturday_match_id, db),
        "sunday": _get_match_detail(cal.sunday_match_id, db),
        "is_locked": cal.is_locked,
    }


@app.post("/matches/{match_id}/schedule")
def schedule_match(match_id: str, payload: ScheduleMatch, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_couple_for_user(user, db)
    match = db.query(Match).filter(Match.id == match_id, Match.couple_id == couple.id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    cal = _get_or_create_calendar(couple.id, week_start, db)
    
    day_field = f"{payload.day.lower()}_match_id"
    if hasattr(cal, day_field):
        setattr(cal, day_field, match_id)
        match.status = "scheduled"
        db.commit()
    
    return {"ok": True}


@app.post("/calendar/auto-schedule")
def auto_schedule(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_couple_for_user(user, db)
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    cal = _get_or_create_calendar(couple.id, week_start, db)
    
    # Get pending matches with recipe details
    matches = db.query(Match).options(joinedload(Match.recipe)).filter(
        Match.couple_id == couple.id,
        Match.status == "pending",
    ).all()
    
    if not matches:
        return {"scheduled": 0, "message": "No pending matches to schedule"}
    
    # Get available days (not already scheduled) — validate matches actually exist
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    available_days = []
    for day in days:
        match_id = getattr(cal, f"{day}_match_id")
        if match_id:
            # Validate the match still exists
            match_exists = db.query(Match).filter(Match.id == match_id).first()
            if not match_exists:
                # Clean up orphaned reference
                setattr(cal, f"{day}_match_id", None)
                available_days.append(day)
        else:
            available_days.append(day)
    
    db.commit()  # Persist any orphaned cleanup
    
    if len(matches) > len(available_days):
        matches = matches[:len(available_days)]
    
    if len(matches) <= 7:
        # Brute force all permutations for optimal assignment
        from itertools import permutations
        
        best_score = float('-inf')
        best_assignment = None
        
        for perm in permutations(matches):
            score = _score_assignment(perm, couple, db)
            if score > best_score:
                best_score = score
                best_assignment = perm
        
        # Apply best assignment
        assigned = 0
        for i, match in enumerate(best_assignment):
            day = available_days[i]
            setattr(cal, f"{day}_match_id", match.id)
            match.status = "scheduled"
            assigned += 1
        
        db.commit()
        return {
            "scheduled": assigned,
            "algorithm": "brute_force_optimal",
            "score": best_score,
        }
    else:
        # Greedy fallback for >7 matches
        assigned = 0
        for match in matches:
            for day in available_days:
                if not getattr(cal, f"{day}_match_id"):
                    setattr(cal, f"{day}_match_id", match.id)
                    match.status = "scheduled"
                    assigned += 1
                    break
        
        db.commit()
        return {"scheduled": assigned, "algorithm": "greedy"}


@app.post("/reset")
def reset_couple_data(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Reset all couple data: delete matches, clear calendar, clear swipes."""
    couple = get_couple_for_user(user, db)
    
    # Delete all swipes for both partners
    partner_ids = [couple.partner_1_id]
    if couple.partner_2_id:
        partner_ids.append(couple.partner_2_id)
    
    db.query(Swipe).filter(Swipe.user_id.in_(partner_ids)).delete(synchronize_session=False)
    
    # Delete all matches for the couple
    db.query(Match).filter(Match.couple_id == couple.id).delete(synchronize_session=False)
    
    # Clear current week's calendar
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    cal = db.query(WeeklyCalendar).filter(
        WeeklyCalendar.couple_id == couple.id,
        WeeklyCalendar.week_start == week_start,
    ).first()
    if cal:
        for day in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]:
            setattr(cal, f"{day}_match_id", None)
    
    db.commit()
    
    return {
        "ok": True,
        "message": "All matches, swipes, and calendar entries cleared. Recipes are back in rotation.",
    }


@app.post("/calendar/move/{match_id}/{from_day}/{to_day}")
def move_match_day(
    match_id: str,
    from_day: str,
    to_day: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Move a scheduled match from one day to another"""
    couple = get_couple_for_user(user, db)
    
    if from_day not in DAYS or to_day not in DAYS:
        raise HTTPException(status_code=400, detail="Invalid day")
    
    match = db.query(Match).filter(Match.id == match_id, Match.couple_id == couple.id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    cal = db.query(WeeklyCalendar).filter(
        WeeklyCalendar.couple_id == couple.id,
        WeeklyCalendar.week_start == week_start
    ).first()
    
    if not cal:
        raise HTTPException(status_code=404, detail="No calendar found")
    
    from_col = f"{from_day}_match_id"
    to_col = f"{to_day}_match_id"
    
    if getattr(cal, from_col) != match_id:
        raise HTTPException(status_code=400, detail="Match not scheduled on that day")
    
    existing = getattr(cal, to_col)
    
    setattr(cal, from_col, None)
    setattr(cal, to_col, match_id)
    match.status = "scheduled"
    
    db.commit()
    
    return {"ok": True, "message": f"Moved from {from_day} to {to_day}", "displaced": existing}


def _score_assignment(matches, couple, db):
    """Score a weekly assignment using multi-objective optimization."""
    w1, w2, w3, w4 = 0.35, 0.30, 0.25, 0.10
    
    # 1. Ingredient Synergy (adjacent day overlap)
    synergy = _ingredient_synergy(matches)
    
    # 2. Perishability Sequencing (fragile ingredients earlier)
    perishability = _perishability_score(matches)
    
    # 3. Time Budget Compliance
    budget = _time_budget_score(matches, couple.time_budget_minutes)
    
    # 4. Palate Variation (avoid same cuisine adjacent)
    variation = _palate_variation(matches)
    
    return w1 * synergy + w2 * perishability + w3 * budget + w4 * variation


def _ingredient_synergy(matches):
    """Higher score when adjacent days share ingredients (lower grocery cost)."""
    if len(matches) < 2:
        return 1.0
    
    score = 0
    for i in range(len(matches) - 1):
        set_a = {ing.name for ing in matches[i].recipe.ingredients}
        set_b = {ing.name for ing in matches[i+1].recipe.ingredients}
        
        if not set_a or not set_b:
            continue
            
        # Jaccard similarity: intersection / union
        intersection = len(set_a & set_b)
        union = len(set_a | set_b)
        
        if union > 0:
            score += intersection / union
    
    # Normalize by number of pairs
    return score / (len(matches) - 1) if len(matches) > 1 else 1.0


def _perishability_score(matches):
    """Higher score when fragile ingredients are scheduled earlier."""
    if not matches:
        return 1.0
    
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    score = 0
    
    for i, match in enumerate(matches):
        # Day index: 0=Monday, 6=Sunday
        day_idx = i
        
        # Get min shelf life among perishable ingredients
        perishable_ings = [ing for ing in match.recipe.ingredients if ing.is_perishable]
        if not perishable_ings:
            score += 1.0  # No perishables = no penalty
            continue
        
        min_shelf = min(ing.shelf_life_days or 7 for ing in perishable_ings)
        
        # Earlier in week = better for short shelf life
        # If min_shelf < day_idx + 1, ingredient spoils before cooking
        if min_shelf >= day_idx + 1:
            score += 1.0
        else:
            # Penalty proportional to how much it spoils before cooking
            score += max(0, min_shelf / (day_idx + 1))
    
    return score / len(matches)


def _time_budget_score(matches, budget_minutes):
    """Higher score when total time fits budget."""
    if not matches or not budget_minutes:
        return 1.0
    
    score = 0
    for match in matches:
        time = match.recipe.total_time_minutes or 60
        if time <= budget_minutes:
            score += 1.0
        elif time <= budget_minutes * 1.5:
            # Stretch zone: partial credit
            score += 0.5
        else:
            score += 0.0
    
    return score / len(matches)


def _palate_variation(matches):
    """Higher score when adjacent days have different cuisines."""
    if len(matches) < 2:
        return 1.0
    
    score = 0
    for i in range(len(matches) - 1):
        tags_a = set(matches[i].recipe.tags or [])
        tags_b = set(matches[i+1].recipe.tags or [])
        
        # Penalize shared cuisine tags
        cuisine_tags = {"thai", "italian", "mexican", "indian", "chinese", "japanese", "french", "mediterranean"}
        shared_cuisine = (tags_a & tags_b) & cuisine_tags
        
        if not shared_cuisine:
            score += 1.0
        else:
            score += 0.5  # Partial penalty for shared cuisine
    
    return score / (len(matches) - 1)


# ─── Pantry ───
@app.get("/pantry")
def get_pantry(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_couple_for_user(user, db)
    items = db.query(PantryItem).filter(PantryItem.couple_id == couple.id).all()
    return {
        "items": [
            {
                "id": i.id,
                "ingredient_name": i.ingredient_name,
                "quantity": i.quantity,
                "unit": i.unit,
                "confidence": i.confidence,
                "last_verified": i.last_verified.isoformat(),
                "category": i.category,
                "is_perishable": i.is_perishable,
                "source": i.source,
            }
            for i in items
        ]
    }


@app.post("/pantry")
def add_pantry_item(payload: PantryItemCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_couple_for_user(user, db)
    item = PantryItem(
        id=str(uuid.uuid4()),
        couple_id=couple.id,
        ingredient_name=payload.ingredient_name,
        quantity=payload.quantity,
        unit=payload.unit,
        category=payload.category,
        is_perishable=payload.is_perishable,
        source="manual",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"id": item.id, "ingredient_name": item.ingredient_name}


# ─── Grocery ───
@app.get("/grocery/current")
def get_grocery_list(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_couple_for_user(user, db)
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    
    gl = db.query(GroceryList).filter(
        GroceryList.couple_id == couple.id,
        GroceryList.week_start == week_start,
    ).first()
    
    if not gl:
        gl = GroceryList(
            id=str(uuid.uuid4()),
            couple_id=couple.id,
            week_start=week_start,
        )
        db.add(gl)
        db.flush()
    
    # Always regenerate from current calendar — meals may have changed
    cal = db.query(WeeklyCalendar).filter(
        WeeklyCalendar.couple_id == couple.id,
        WeeklyCalendar.week_start == week_start,
    ).first()
    
    # Clear old items
    db.query(GroceryItem).filter(GroceryItem.grocery_list_id == gl.id).delete(synchronize_session=False)
    
    if cal:
        # Aggregate ingredients from scheduled matches
        day_fields = ["monday_match_id", "tuesday_match_id", "wednesday_match_id",
                     "thursday_match_id", "friday_match_id", "saturday_match_id", "sunday_match_id"]
        ingredient_map = {}
        
        for field in day_fields:
            match_id = getattr(cal, field)
            if match_id:
                match = db.query(Match).filter(Match.id == match_id).first()
                if match:
                    for ing in match.recipe.ingredients:
                        key = ing.name
                        if key not in ingredient_map:
                            ingredient_map[key] = {
                                "quantity": ing.quantity or 0,
                                "unit": ing.unit,
                                "category": ing.category,
                                "recipe_ids": [match.recipe_id],
                            }
                        else:
                            ingredient_map[key]["quantity"] += ing.quantity or 0
                            ingredient_map[key]["recipe_ids"].append(match.recipe_id)
        
        # Subtract pantry items with high confidence
        pantry = db.query(PantryItem).filter(
            PantryItem.couple_id == couple.id,
            PantryItem.confidence > 0.7,
        ).all()
        pantry_names = {p.ingredient_name.lower(): p for p in pantry}
        
        for name, data in ingredient_map.items():
            if name.lower() not in pantry_names:
                gi = GroceryItem(
                    id=str(uuid.uuid4()),
                    grocery_list_id=gl.id,
                    ingredient_name=name,
                    quantity=data["quantity"],
                    unit=data["unit"],
                    category=data["category"],
                    source_recipe_ids=data["recipe_ids"],
                )
                db.add(gi)
    
    db.commit()
    db.refresh(gl)
    
    return {
        "id": gl.id,
        "week_start": str(gl.week_start),
        "is_shopped": gl.is_shopped,
        "items": [
            {
                "id": i.id,
                "ingredient_name": i.ingredient_name,
                "quantity": i.quantity,
                "unit": i.unit,
                "category": i.category,
                "source_recipe_ids": i.source_recipe_ids or [],
                "is_checked": i.is_checked,
                "is_substitution": i.is_substitution,
                "substitution_reason": i.substitution_reason,
            }
            for i in gl.items
        ],
    }


@app.post("/grocery/check")
def check_grocery_item(payload: GroceryCheckItem, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(GroceryItem).filter(GroceryItem.id == payload.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    item.is_checked = payload.is_checked
    db.commit()
    
    # Update pantry: checked items get added, unchecked items boost confidence
    couple = get_couple_for_user(user, db)
    if payload.is_checked:
        # Add to pantry
        existing = db.query(PantryItem).filter(
            PantryItem.couple_id == couple.id,
            PantryItem.ingredient_name == item.ingredient_name,
        ).first()
        if existing:
            existing.quantity = (existing.quantity or 0) + (item.quantity or 0)
            existing.confidence = 0.95
            existing.last_verified = datetime.utcnow()
        else:
            pantry_item = PantryItem(
                id=str(uuid.uuid4()),
                couple_id=couple.id,
                ingredient_name=item.ingredient_name,
                quantity=item.quantity,
                unit=item.unit,
                category=item.category,
                confidence=0.95,
                source="inferred_grocery",
            )
            db.add(pantry_item)
    else:
        # Boost confidence of existing pantry item
        existing = db.query(PantryItem).filter(
            PantryItem.couple_id == couple.id,
            PantryItem.ingredient_name == item.ingredient_name,
        ).first()
        if existing:
            existing.confidence = min(0.95, existing.confidence + 0.15)
            existing.last_verified = datetime.utcnow()
    
    db.commit()
    return {"ok": True}


# ─── Veto ───
@app.delete("/calendar/{day}")
def request_veto(day: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_couple_for_user(user, db)
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    cal = db.query(WeeklyCalendar).filter(
        WeeklyCalendar.couple_id == couple.id,
        WeeklyCalendar.week_start == week_start,
    ).first()
    
    if not cal:
        raise HTTPException(status_code=404, detail="No calendar found")
    
    match_id = getattr(cal, f"{day.lower()}_match_id")
    if not match_id:
        raise HTTPException(status_code=404, detail="No meal scheduled for this day")
    
    # Create veto request
    veto = VetoRequest(
        id=str(uuid.uuid4()),
        couple_id=couple.id,
        requesting_partner_id=user.id,
        calendar_id=cal.id,
        day=day.lower(),
    )
    db.add(veto)
    db.commit()
    
    return {"veto_id": veto.id, "status": "pending", "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat()}


@app.post("/vetos/{veto_id}/resolve")
def resolve_veto(veto_id: str, payload: VetoResolve, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_couple_for_user(user, db)
    veto = db.query(VetoRequest).filter(VetoRequest.id == veto_id, VetoRequest.couple_id == couple.id).first()
    if not veto:
        raise HTTPException(status_code=404, detail="Veto not found")
    if veto.status != "pending":
        raise HTTPException(status_code=409, detail="Veto already resolved")
    if veto.requesting_partner_id == user.id:
        raise HTTPException(status_code=403, detail="Cannot resolve your own veto")
    
    veto.status = "approved" if payload.approve else "rejected"
    veto.resolved_at = datetime.utcnow()
    
    if payload.approve:
        # Remove the match from the calendar day
        cal = db.query(WeeklyCalendar).filter(WeeklyCalendar.id == veto.calendar_id).first()
        if cal:
            day_field = f"{veto.day}_match_id"
            match_id = getattr(cal, day_field)
            setattr(cal, day_field, None)
            # Update match status
            match = db.query(Match).filter(Match.id == match_id).first()
            if match:
                match.status = "removed"
    
    db.commit()
    return {"ok": True, "status": veto.status}


# ─── Match Status ───
@app.patch("/matches/{match_id}")
def update_match_status(match_id: str, payload: dict, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_couple_for_user(user, db)
    match = db.query(Match).filter(Match.id == match_id, Match.couple_id == couple.id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    new_status = payload.get("status")
    if new_status not in ["pending", "scheduled", "cooked", "removed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    match.status = new_status
    
    if new_status == "cooked":
        # Decrement pantry items
        recipe = db.query(Recipe).filter(Recipe.id == match.recipe_id).first()
        if recipe:
            for ing in recipe.ingredients:
                pantry_item = db.query(PantryItem).filter(
                    PantryItem.couple_id == couple.id,
                    PantryItem.ingredient_name == ing.name,
                ).first()
                if pantry_item:
                    pantry_item.quantity = max(0, (pantry_item.quantity or 0) - (ing.quantity or 0))
                    if pantry_item.quantity <= 0:
                        pantry_item.confidence = 0.0
    
    db.commit()
    return {"ok": True, "status": match.status}


# ─── Recipe Image Proxy ───
@app.get("/recipes/{recipe_id}/image")
def get_recipe_image(recipe_id: str, db: Session = Depends(get_db)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    # Return Spoonacular image URL directly for MVP (proxy via backend)
    if recipe.image_url:
        return {"image_url": recipe.image_url}
    
    # Fallback: construct Spoonacular image URL from ID
    if recipe.spoonacular_id:
        return {"image_url": f"https://spoonacular.com/recipeImages/{recipe.spoonacular_id}-556x370.jpg"}
    
    raise HTTPException(status_code=404, detail="No image available")


# ─── Clear Calendar ───
@app.post("/calendar/clear")
def clear_calendar(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_couple_for_user(user, db)
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    cal = db.query(WeeklyCalendar).filter(
        WeeklyCalendar.couple_id == couple.id,
        WeeklyCalendar.week_start == week_start,
    ).first()
    if not cal:
        return {"cleared": 0}

    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    cleared = 0
    for day in days:
        field = f"{day}_match_id"
        match_id = getattr(cal, field)
        if match_id:
            match = db.query(Match).filter(Match.id == match_id).first()
            if match:
                match.status = "pending"
            setattr(cal, field, None)
            cleared += 1

    db.commit()
    return {"cleared": cleared}


@app.post("/calendar/remove/{day}")
def remove_meal(day: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Immediately remove a meal from the calendar and put match back to pending."""
    couple = get_couple_for_user(user, db)
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    cal = db.query(WeeklyCalendar).filter(
        WeeklyCalendar.couple_id == couple.id,
        WeeklyCalendar.week_start == week_start,
    ).first()
    
    if not cal:
        raise HTTPException(status_code=404, detail="No calendar found")
    
    day = day.lower()
    if day not in DAYS:
        raise HTTPException(status_code=400, detail="Invalid day")
    
    field = f"{day}_match_id"
    match_id = getattr(cal, field)
    if not match_id:
        raise HTTPException(status_code=404, detail="No meal scheduled for this day")
    
    match = db.query(Match).filter(Match.id == match_id, Match.couple_id == couple.id).first()
    if match:
        match.status = "pending"
    
    setattr(cal, field, None)
    db.commit()
    
    return {"ok": True, "message": f"Removed from {day}. Match is back in your matches list."}


@app.get("/grocery/export")
def export_grocery(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_couple_for_user(user, db)
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    
    gl = db.query(GroceryList).filter(
        GroceryList.couple_id == couple.id,
        GroceryList.week_start == week_start,
    ).first()
    
    if not gl:
        raise HTTPException(status_code=404, detail="No grocery list found")
    
    lines = ["🛒 DishSync Grocery List", f"Week of {week_start}", ""]
    
    # Group by category
    by_category = {}
    for item in gl.items:
        cat = item.category or "Other"
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(item)
    
    for cat, items in sorted(by_category.items()):
        lines.append(f"\n{cat.upper()}")
        for item in items:
            status = "[x]" if item.is_checked else "[ ]"
            qty = f"{item.quantity} {item.unit}" if item.quantity else ""
            lines.append(f"  {status} {item.ingredient_name} {qty}")
    
    return {"text": "\n".join(lines)}


# ─── Pantry Decay (Manual Trigger for MVP) ───
@app.post("/pantry/decay")
def trigger_pantry_decay(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_couple_for_user(user, db)
    items = db.query(PantryItem).filter(PantryItem.couple_id == couple.id).all()
    
    decayed = 0
    for item in items:
        if item.is_perishable and item.confidence > 0:
            item.confidence -= item.decay_rate
            item.confidence = max(0.0, item.confidence)
            decayed += 1
    
    db.commit()
    return {"decayed_items": decayed, "message": f"Applied decay to {decayed} perishable items"}
