from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, JSON, Boolean, Date, Enum as SQLEnum
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
import uuid

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), nullable=False, unique=True)
    hashed_password = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Couple(Base):
    __tablename__ = "couples"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    partner_1_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    partner_2_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    invite_code = Column(String(10), nullable=False, unique=True)
    time_budget_minutes = Column(Integer, nullable=False, default=60)
    dietary_restrictions = Column(JSON, default=list)
    disliked_ingredients = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    spoonacular_id = Column(Integer, nullable=False, unique=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    image_local_path = Column(String(500), nullable=True)
    total_time_minutes = Column(Integer, nullable=False)
    active_time_minutes = Column(Integer, nullable=True)
    instructions = Column(JSON, nullable=True)  # ephemeral, 24h cache
    tags = Column(JSON, default=list)
    source_url = Column(String(500), nullable=True)
    cached_at = Column(DateTime(timezone=True), server_default=func.now())

    ingredients = relationship("RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan")


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    recipe_id = Column(String(36), ForeignKey("recipes.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)  # canonical name
    original_name = Column(String(255), nullable=True)
    quantity = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)
    category = Column(String(50), nullable=False)
    is_perishable = Column(Boolean, nullable=False, default=True)
    shelf_life_days = Column(Integer, nullable=True)

    recipe = relationship("Recipe", back_populates="ingredients")


class Swipe(Base):
    __tablename__ = "swipes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    recipe_id = Column(String(36), ForeignKey("recipes.id"), nullable=False)
    direction = Column(String(10), nullable=False)  # "left" or "right"
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Match(Base):
    __tablename__ = "matches"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    couple_id = Column(String(36), ForeignKey("couples.id"), nullable=False)
    recipe_id = Column(String(36), ForeignKey("recipes.id"), nullable=False)
    partner_1_swipe_id = Column(String(36), ForeignKey("swipes.id"), nullable=False)
    partner_2_swipe_id = Column(String(36), ForeignKey("swipes.id"), nullable=True)
    status = Column(String(20), nullable=False, default="pending")
    matched_at = Column(DateTime(timezone=True), server_default=func.now())

    recipe = relationship("Recipe", foreign_keys=[recipe_id])
    couple = relationship("Couple", foreign_keys=[couple_id])


class WeeklyCalendar(Base):
    __tablename__ = "weekly_calendars"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    couple_id = Column(String(36), ForeignKey("couples.id"), nullable=False)
    week_start = Column(Date, nullable=False)
    monday_match_id = Column(String(36), ForeignKey("matches.id"), nullable=True)
    tuesday_match_id = Column(String(36), ForeignKey("matches.id"), nullable=True)
    wednesday_match_id = Column(String(36), ForeignKey("matches.id"), nullable=True)
    thursday_match_id = Column(String(36), ForeignKey("matches.id"), nullable=True)
    friday_match_id = Column(String(36), ForeignKey("matches.id"), nullable=True)
    saturday_match_id = Column(String(36), ForeignKey("matches.id"), nullable=True)
    sunday_match_id = Column(String(36), ForeignKey("matches.id"), nullable=True)
    is_locked = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PantryItem(Base):
    __tablename__ = "pantry_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    couple_id = Column(String(36), ForeignKey("couples.id"), nullable=False)
    ingredient_name = Column(String(100), nullable=False)
    quantity = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)
    confidence = Column(Float, nullable=False, default=1.0)
    last_verified = Column(DateTime(timezone=True), server_default=func.now())
    decay_rate = Column(Float, nullable=False, default=0.1)  # per day
    category = Column(String(50), nullable=False)
    is_perishable = Column(Boolean, nullable=False, default=True)
    source = Column(String(20), nullable=False, default="manual")  # manual, inferred_grocery, inferred_cooking


class GroceryList(Base):
    __tablename__ = "grocery_lists"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    couple_id = Column(String(36), ForeignKey("couples.id"), nullable=False)
    week_start = Column(Date, nullable=False)
    is_shopped = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    items = relationship("GroceryItem", back_populates="grocery_list", cascade="all, delete-orphan")


class GroceryItem(Base):
    __tablename__ = "grocery_items"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    grocery_list_id = Column(String(36), ForeignKey("grocery_lists.id", ondelete="CASCADE"), nullable=False)
    ingredient_name = Column(String(100), nullable=False)
    quantity = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)
    category = Column(String(50), nullable=False)
    source_recipe_ids = Column(JSON, default=list)
    is_checked = Column(Boolean, nullable=False, default=False)
    is_substitution = Column(Boolean, nullable=False, default=False)
    substitution_reason = Column(String(255), nullable=True)

    grocery_list = relationship("GroceryList", back_populates="items")


class VetoRequest(Base):
    __tablename__ = "veto_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    couple_id = Column(String(36), ForeignKey("couples.id"), nullable=False)
    requesting_partner_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    calendar_id = Column(String(36), ForeignKey("weekly_calendars.id"), nullable=False)
    day = Column(String(10), nullable=False)  # monday, tuesday, etc.
    proposed_replacement_match_id = Column(String(36), ForeignKey("matches.id"), nullable=True)
    status = Column(String(20), nullable=False, default="pending")  # pending, approved, rejected, auto_approved
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
