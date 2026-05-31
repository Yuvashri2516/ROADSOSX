"""
RoadSoS X — pytest configuration
Ensures the backend-gateway package is on sys.path for all CI environments.
"""
import sys
import os

# Add backend-gateway to sys.path so imports work in CI
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend-gateway'))

# Use SQLite in-memory for all tests
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("JWT_SECRET", "ci_test_secret_key_2026")
