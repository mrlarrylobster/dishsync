from fastapi.testclient import TestClient
from app.main import app, _ingredient_synergy, _perishability_score, _time_budget_score, _palate_variation
from app.db import init_db, SessionLocal
from app.models import Recipe, RecipeIngredient, Match, User, Couple, Swipe
import uuid
import time

init_db()
client = TestClient(app)

def _unique_ts():
    return int(time.time() * 1000000)


def test_ingredient_synergy():
    """Test that recipes sharing ingredients get higher synergy scores."""
    ts = _unique_ts()
    db = SessionLocal()
    
    r1 = Recipe(id=str(uuid.uuid4()), spoonacular_id=ts+1, title="Pasta", total_time_minutes=30)
    r1.ingredients = [
        RecipeIngredient(id=str(uuid.uuid4()), recipe_id=r1.id, name="pasta", category="dry_goods", is_perishable=False),
        RecipeIngredient(id=str(uuid.uuid4()), recipe_id=r1.id, name="tomato", category="produce", is_perishable=True, shelf_life_days=7),
        RecipeIngredient(id=str(uuid.uuid4()), recipe_id=r1.id, name="basil", category="produce", is_perishable=True, shelf_life_days=4),
    ]
    
    r2 = Recipe(id=str(uuid.uuid4()), spoonacular_id=ts+2, title="Pizza", total_time_minutes=45)
    r2.ingredients = [
        RecipeIngredient(id=str(uuid.uuid4()), recipe_id=r2.id, name="flour", category="dry_goods", is_perishable=False),
        RecipeIngredient(id=str(uuid.uuid4()), recipe_id=r2.id, name="tomato", category="produce", is_perishable=True, shelf_life_days=7),
        RecipeIngredient(id=str(uuid.uuid4()), recipe_id=r2.id, name="basil", category="produce", is_perishable=True, shelf_life_days=4),
    ]
    
    r3 = Recipe(id=str(uuid.uuid4()), spoonacular_id=ts+3, title="Steak", total_time_minutes=20)
    r3.ingredients = [
        RecipeIngredient(id=str(uuid.uuid4()), recipe_id=r3.id, name="beef", category="meat", is_perishable=True, shelf_life_days=3),
        RecipeIngredient(id=str(uuid.uuid4()), recipe_id=r3.id, name="potato", category="produce", is_perishable=True, shelf_life_days=14),
    ]
    
    db.add_all([r1, r2, r3])
    db.commit()
    
    m1 = Match(id=str(uuid.uuid4()), recipe_id=r1.id, status="pending")
    m1.recipe = r1
    m2 = Match(id=str(uuid.uuid4()), recipe_id=r2.id, status="pending")
    m2.recipe = r2
    m3 = Match(id=str(uuid.uuid4()), recipe_id=r3.id, status="pending")
    m3.recipe = r3
    
    synergy_good = _ingredient_synergy([m1, m2])
    synergy_bad = _ingredient_synergy([m1, m3])
    
    assert synergy_good > synergy_bad, "Recipes sharing ingredients should have higher synergy"
    assert synergy_good > 0.3, "Tomato+basil overlap should yield ~0.5 synergy"
    
    db.close()


def test_perishability_sequencing():
    """Test that fragile ingredients scheduled earlier score higher."""
    ts = _unique_ts()
    db = SessionLocal()
    
    r1 = Recipe(id=str(uuid.uuid4()), spoonacular_id=ts+4, title="Fresh Fish", total_time_minutes=20)
    r1.ingredients = [
        RecipeIngredient(id=str(uuid.uuid4()), recipe_id=r1.id, name="salmon", category="meat", is_perishable=True, shelf_life_days=3),
    ]
    
    r2 = Recipe(id=str(uuid.uuid4()), spoonacular_id=ts+5, title="Rice Bowl", total_time_minutes=25)
    r2.ingredients = [
        RecipeIngredient(id=str(uuid.uuid4()), recipe_id=r2.id, name="rice", category="dry_goods", is_perishable=False),
    ]
    
    db.add_all([r1, r2])
    db.commit()
    
    m1 = Match(id=str(uuid.uuid4()), recipe_id=r1.id, status="pending")
    m1.recipe = r1
    m2 = Match(id=str(uuid.uuid4()), recipe_id=r2.id, status="pending")
    m2.recipe = r2
    
    score_early = _perishability_score([m1, m2])
    score_late = _perishability_score([m2, m1])
    
    assert score_early >= score_late, "Fragile ingredients earlier should score higher"
    
    db.close()


def test_time_budget_compliance():
    """Test that recipes within budget score higher."""
    ts = _unique_ts()
    db = SessionLocal()
    
    r1 = Recipe(id=str(uuid.uuid4()), spoonacular_id=ts+6, title="Quick Salad", total_time_minutes=15)
    r1.ingredients = []
    
    r2 = Recipe(id=str(uuid.uuid4()), spoonacular_id=ts+7, title="Slow Roast", total_time_minutes=120)
    r2.ingredients = []
    
    db.add_all([r1, r2])
    db.commit()
    
    m1 = Match(id=str(uuid.uuid4()), recipe_id=r1.id, status="pending")
    m1.recipe = r1
    m2 = Match(id=str(uuid.uuid4()), recipe_id=r2.id, status="pending")
    m2.recipe = r2
    
    score_within = _time_budget_score([m1], 30)
    score_over = _time_budget_score([m2], 30)
    
    assert score_within > score_over, "Recipe within budget should score higher"
    assert score_within == 1.0, "15-min recipe with 30-min budget should get perfect score"
    
    db.close()


def test_palate_variation():
    """Test that different cuisines adjacent score higher."""
    ts = _unique_ts()
    db = SessionLocal()
    
    r1 = Recipe(id=str(uuid.uuid4()), spoonacular_id=ts+8, title="Thai Curry", total_time_minutes=30)
    r1.ingredients = []
    r1.tags = ["thai", "spicy"]
    
    r2 = Recipe(id=str(uuid.uuid4()), spoonacular_id=ts+9, title="Pad Thai", total_time_minutes=25)
    r2.ingredients = []
    r2.tags = ["thai", "noodles"]
    
    r3 = Recipe(id=str(uuid.uuid4()), spoonacular_id=ts+10, title="Italian Pasta", total_time_minutes=20)
    r3.ingredients = []
    r3.tags = ["italian", "pasta"]
    
    db.add_all([r1, r2, r3])
    db.commit()
    
    m1 = Match(id=str(uuid.uuid4()), recipe_id=r1.id, status="pending")
    m1.recipe = r1
    m2 = Match(id=str(uuid.uuid4()), recipe_id=r2.id, status="pending")
    m2.recipe = r2
    m3 = Match(id=str(uuid.uuid4()), recipe_id=r3.id, status="pending")
    m3.recipe = r3
    
    score_same_cuisine = _palate_variation([m1, m2])
    score_diff_cuisine = _palate_variation([m1, m3])
    
    assert score_diff_cuisine > score_same_cuisine, "Different cuisines should score higher"
    
    db.close()
