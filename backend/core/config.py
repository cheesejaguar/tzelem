from pathlib import Path

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Get the repository root directory (parent of backend)
REPO_ROOT = Path(__file__).parent.parent.parent
ENV_FILE = REPO_ROOT / ".env"

# Load .env file from repository root
load_dotenv(ENV_FILE)


class Settings(BaseSettings):
    debug: bool = False
    daily_api_key: str | None = None
    daily_api_url: str = "https://api.daily.co/v1"

    # Rate limiting configuration
    rate_limit_enabled: bool = True
    rate_limit_requests: int = 100  # Default requests per minute
    rate_limit_window: int = 60  # Window in seconds (1 minute)
    
    # Endpoint-specific rate limits (requests per minute)
    rate_limit_voice_create: int = 10  # Voice room creation
    rate_limit_mail_send: int = 30  # Email sending
    rate_limit_flow_execute: int = 20  # Flow execution
    rate_limit_runs: int = 50  # Run operations

    cors_origins: list[str] = [
        "http://localhost:5173",  # Vite dev server (default)
        "http://localhost:5174",  # Vite dev server (alternative)
        "http://localhost:5175",  # Vite dev server (alternative)
        "http://localhost:3000",  # Alternative dev port
        "https://staging.tzlm.io",  # Staging environment
        "https://tzlm.io",  # Production environment
        "https://tzelem.vercel.app",  # Main Vercel deployment
        "https://tzelem-*.vercel.app",  # Vercel preview deployments
        "https://*.vercel.app",  # All Vercel deployments (temporary)
    ]

    class Config:
        env_file = str(ENV_FILE) if ENV_FILE.exists() else ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra environment variables


settings = Settings()
