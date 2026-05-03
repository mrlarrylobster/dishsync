from fastapi.testclient import TestClient
from app.main import app
from app.db import init_db

# Initialize database before tests
init_db()

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_register_and_login():
    # Register
    resp = client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "password123",
        "display_name": "Test User",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["user"]["email"] == "test@example.com"
    
    # Login
    resp = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "password123",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data


def test_login_wrong_password():
    resp = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401
