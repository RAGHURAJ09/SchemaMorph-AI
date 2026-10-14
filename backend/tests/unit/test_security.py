"""
Unit tests for password complexity and security utilities.
"""
import pytest
from app.core.security import (
    validate_password_complexity,
    hash_password,
    verify_password,
)


def test_password_valid():
    valid, errors = validate_password_complexity("StrongP@ss123")
    assert valid is True
    assert len(errors) == 0


def test_password_missing_uppercase():
    valid, errors = validate_password_complexity("weakp@ss123")
    assert valid is False
    assert any("uppercase" in err.lower() or "capital" in err.lower() for err in errors)


def test_password_missing_lowercase():
    valid, errors = validate_password_complexity("WEAKP@SS123")
    assert valid is False
    assert any("lowercase" in err.lower() or "small" in err.lower() for err in errors)


def test_password_missing_number():
    valid, errors = validate_password_complexity("WeakPass@Word")
    assert valid is False
    assert any("number" in err.lower() for err in errors)


def test_password_missing_special_character():
    valid, errors = validate_password_complexity("WeakPass1234")
    assert valid is False
    assert any("special" in err.lower() for err in errors)


def test_password_too_short():
    valid, errors = validate_password_complexity("P@1a")
    assert valid is False
    assert any("8 characters" in err.lower() for err in errors)


def test_hash_password_enforce_valid():
    hashed = hash_password("ValidP@ss123", enforce_rules=True)
    assert verify_password("ValidP@ss123", hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_hash_password_enforce_invalid_raises():
    with pytest.raises(ValueError, match="Password requirement not met"):
        hash_password("no-uppercase-123!", enforce_rules=True)
