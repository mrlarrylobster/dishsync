from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session, joinedload
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, date
import uuid
import secrets
import httpx
import os

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
app = FastAPI(title="DishSync API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        ri = RecipeIngredient(
            id=str(uuid.uuid4()),
            recipe_id=recipe.id,
            name=ing.get("name", "unknown"),
            original_name=ing.get("originalName"),
            quantity=ing.get("amount"),
            unit=ing.get("unit"),
            category=ing.get("aisle", "unknown"),
            is_perishable=ing.get("aisle", "") in ["Produce", "Meat", "Seafood", "Milk, Eggs, Other Dairy"],
            shelf_life_days=7 if ing.get("aisle", "") in ["Produce"] else 14,
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


@app.get("/recipes/feed")
def get_recipe_feed(
    limit: int = 20,
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    couple = get_couple_for_user(user, db)
    
    # Get already swiped recipe IDs
    swiped_ids = [
        s.recipe_id for s in db.query(Swipe).filter(
            Swipe.user_id == user.id,
            Swipe.created_at > datetime.utcnow() - timedelta(days=30)
        ).all()
    ]
    
    # Try to get from cache first
    recipes = db.query(Recipe).filter(~Recipe.id.in_(swiped_ids)).limit(limit).offset(offset).all()
    
    # If cache is low, fetch from Spoonacular
    if len(recipes) < limit and SPOONACULAR_API_KEY:
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
            if resp.status_code == 200:
                for r in resp.json().get("results", []):
                    # Check if already in DB
                    existing = db.query(Recipe).filter(Recipe.spoonacular_id == r["id"]).first()
                    if not existing:
                        _spoonacular_to_recipe(r, db)
                db.commit()
                # Re-fetch
                recipes = db.query(Recipe).filter(~Recipe.id.in_(swiped_ids)).limit(limit).offset(offset).all()
        except Exception as e:
            print(f"Spoonacular fetch error: {e}")
    
    # Filter by time budget (with stretch)
    budget = couple.time_budget_minutes
    result = []
    for r in recipes:
        is_stretch = r.total_time_minutes > budget
        if r.total_time_minutes <= budget * 1.5:  # Show up to 50% over budget as stretch
            result.append({
                **_recipe_to_read(r),
                "is_stretch": is_stretch,
                "stretch_minutes": max(0, r.total_time_minutes - budget) if is_stretch else 0,
            })
    
    return {"recipes": result[:limit]}


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
    matches = db.query(Match).filter(Match.couple_id == couple.id).all()
    return {"matches": [_recipe_to_read(m.recipe) for m in matches]}


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


@app.get("/calendar/current")
def get_current_calendar(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    couple = get_couple_for_user(user, db)
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    cal = _get_or_create_calendar(couple.id, week_start, db)
    
    def _get_match(match_id):
        if not match_id:
            return None
        m = db.query(Match).filter(Match.id == match_id).first()
        return {"id": m.id, "recipe": _recipe_to_read(m.recipe)} if m else None
    
    return {
        "id": cal.id,
        "week_start": str(cal.week_start),
        "monday": _get_match(cal.monday_match_id),
        "tuesday": _get_match(cal.tuesday_match_id),
        "wednesday": _get_match(cal.wednesday_match_id),
        "thursday": _get_match(cal.thursday_match_id),
        "friday": _get_match(cal.friday_match_id),
        "saturday": _get_match(cal.saturday_match_id),
        "sunday": _get_match(cal.sunday_match_id),
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
    
    # Get pending matches
    matches = db.query(Match).filter(
        Match.couple_id == couple.id,
        Match.status == "pending",
    ).all()
    
    if not matches:
        return {"scheduled": 0, "message": "No pending matches to schedule"}
    
    # Simple greedy assignment: assign to first available day
    days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    assigned = 0
    for match in matches:
        for day in days:
            if not getattr(cal, f"{day}_match_id"):
                setattr(cal, f"{day}_match_id", match.id)
                match.status = "scheduled"
                assigned += 1
                break
    
    db.commit()
    return {"scheduled": assigned}


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
        # Generate from calendar
        cal = db.query(WeeklyCalendar).filter(
            WeeklyCalendar.couple_id == couple.id,
            WeeklyCalendar.week_start == week_start,
        ).first()
        
        gl = GroceryList(
            id=str(uuid.uuid4()),
            couple_id=couple.id,
            week_start=week_start,
        )
        db.add(gl)
        db.flush()
        
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
