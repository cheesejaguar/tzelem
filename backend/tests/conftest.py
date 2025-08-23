import sys
from pathlib import Path
from unittest.mock import patch

import pytest

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))


@pytest.fixture
def mock_settings():
    """Fixture to provide mock settings for tests."""
    with patch("core.config.settings") as mock:
        mock.debug = False
        mock.daily_api_key = "test-api-key"
        mock.daily_api_url = "https://api.daily.co/v1"
        mock.cors_origins = ["http://localhost:5173", "http://localhost:3000"]
        yield mock


@pytest.fixture
def mock_daily_api_key():
    """Fixture to mock Daily API key."""
    with patch("core.config.settings.daily_api_key", "test-daily-api-key"):
        yield "test-daily-api-key"


@pytest.fixture
def mock_debug_mode():
    """Fixture to enable debug mode."""
    with patch("core.config.settings.debug", True):
        yield True
