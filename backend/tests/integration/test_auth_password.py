"""
Integration tests for auth endpoints password complexity enforcement.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register_password_complexity():
    # Attempt register with missing uppercase
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": "newuser1@gmail.com", "password": "weakpass123!"}
    )
    assert resp.status_code == 422
    assert "uppercase" in resp.json()["detail"].lower() or "capital" in resp.json()["detail"].lower()

    # Attempt register with missing special character
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": "newuser2@gmail.com", "password": "WeakPass1234"}
    )
    assert resp.status_code == 422
    assert "special character" in resp.json()["detail"].lower()

    # Attempt register with missing number
    resp = client.post(
        "/api/v1/auth/register",
        json={"email": "newuser3@gmail.com", "password": "WeakPassword!@"}
    )
    assert resp.status_code == 422
    assert "number" in resp.json()["detail"].lower()
