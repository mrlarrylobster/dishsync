from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date


# ─── Auth ───
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    display_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: str
    email: str
    display_name: str


# ─── Couple ───
class CoupleCreate(BaseModel):
    time_budget_minutes: int = 60
    dietary_restrictions: List[str] = []
    disliked_ingredients: List[str] = []


class CoupleJoin(BaseModel):
    invite_code: str


class CoupleRead(BaseModel):
    id: str
    partner_1: UserRead
    partner_2: Optional[UserRead] = None
    invite_code: str
    time_budget_minutes: int
    dietary_restrictions: List[str]
    disliked_ingredients: List[str]


class CoupleUpdate(BaseModel):
    time_budget_minutes: Optional[int] = None
    dietary_restrictions: Optional[List[str]] = None
    disliked_ingredients: Optional[List[str]] = None


# ─── Recipe ───
class RecipeIngredientRead(BaseModel):
    name: str
    original_name: Optional[str]
    quantity: Optional[float]
    unit: Optional[str]
    category: str
    is_perishable: bool
    shelf_life_days: Optional[int]


class RecipeRead(BaseModel):
    id: str
    spoonacular_id: int
    title: str
    description: Optional[str]
    image_url: Optional[str]
    total_time_minutes: int
    active_time_minutes: Optional[int]
    tags: List[str]
    ingredients: List[RecipeIngredientRead]


# ─── Swipe ───
class SwipeCreate(BaseModel):
    recipe_id: str
    direction: str  # "left" or "right"


class SwipeRead(BaseModel):
    id: str
    recipe_id: str
    direction: str
    created_at: datetime


# ─── Match ───
class MatchRead(BaseModel):
    id: str
    recipe: RecipeRead
    status: str
    matched_at: datetime


# ─── Calendar ───
class CalendarDay(str):
    pass


class ScheduleMatch(BaseModel):
    match_id: str
    day: str  # monday, tuesday, etc.


class WeeklyCalendarRead(BaseModel):
    id: str
    week_start: date
    monday: Optional[MatchRead] = None
    tuesday: Optional[MatchRead] = None
    wednesday: Optional[MatchRead] = None
    thursday: Optional[MatchRead] = None
    friday: Optional[MatchRead] = None
    saturday: Optional[MatchRead] = None
    sunday: Optional[MatchRead] = None
    is_locked: bool


# ─── Pantry ───
class PantryItemCreate(BaseModel):
    ingredient_name: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    category: str
    is_perishable: bool = True
    shelf_life_days: Optional[int] = None


class PantryItemRead(BaseModel):
    id: str
    ingredient_name: str
    quantity: Optional[float]
    unit: Optional[str]
    confidence: float
    last_verified: datetime
    category: str
    is_perishable: bool
    source: str


# ─── Grocery ───
class GroceryItemRead(BaseModel):
    id: str
    ingredient_name: str
    quantity: Optional[float]
    unit: Optional[str]
    category: str
    source_recipe_ids: List[str]
    is_checked: bool
    is_substitution: bool
    substitution_reason: Optional[str]


class GroceryListRead(BaseModel):
    id: str
    week_start: date
    is_shopped: bool
    items: List[GroceryItemRead]


class GroceryCheckItem(BaseModel):
    item_id: str
    is_checked: bool


# ─── Veto ───
class VetoResolve(BaseModel):
    approve: bool
