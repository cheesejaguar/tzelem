"""
Vercel serverless function wrapper for FastAPI backend.
This file serves as the entry point for Vercel Functions.
"""
import os
import sys
from pathlib import Path

# Add backend directory to Python path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# Set up environment
os.environ.setdefault("DEBUG", "false")

# Import the FastAPI app
from backend.main import app

# Export the app as 'handler' for Vercel
# Vercel will use this to handle requests
handler = app