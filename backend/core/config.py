from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Get the repository root directory (parent of backend)
REPO_ROOT = Path(__file__).parent.parent.parent
ENV_FILE = REPO_ROOT / ".env"

# Load .env file from repository root
load_dotenv(ENV_FILE)


class Settings(BaseSettings):
    debug: bool = False
    daily_api_key: Optional[str] = None
    daily_api_url: str = "https://api.daily.co/v1"
    
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = str(ENV_FILE) if ENV_FILE.exists() else ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra environment variables


settings = Settings()