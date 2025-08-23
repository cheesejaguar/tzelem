# Tanay Backend

FastAPI backend for the Tanay multi-agent orchestration platform with Daily.co WebRTC integration.

## Prerequisites

- Python 3.11+
- [uv](https://github.com/astral-sh/uv) package manager
- Daily.co API key

## Setup

1. Install uv (if not already installed):
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. Install dependencies:
```bash
# Install all dependencies including dev tools
uv sync --extra dev
```

3. Configure environment:
```bash
# Copy the example env file from repository root
cp ../.env.example ../.env
# Edit ../.env with your Daily API credentials
```

The `.env` file should be in the repository root (parent of backend) and include:
```
DAILY_API_KEY=your_daily_api_key_here
DEBUG=false  # Set to true for debug mode
```

4. Run the server:
```bash
# Using uv run
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or using the run script
uv run python run.py
```

## API Endpoints

### Voice/WebRTC

- `POST /api/voice/rooms` - Create a new Daily WebRTC room
  - Returns: `{ "room": "<room_url>", "joinToken": "<token>" }`
  - The token expires after 1 hour by default

### Health Checks

- `GET /` - Root health check
- `GET /health` - Detailed health status

## Development

### Running Tests
```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov

# Run specific test file
uv run pytest tests/test_voice.py
```

### Code Quality Tools
```bash
# Run linter
uv run ruff check .

# Auto-fix linting issues
uv run ruff check . --fix

# Format code
uv run ruff format .

# Type checking
uv run mypy .
```

### Debug Mode

Set `DEBUG=true` in your `.env` file to enable:
- Debug logging to console
- Detailed room creation logs
- Token preview in logs
- Auto-reload on code changes

## API Documentation

When the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Testing the API

### Create a Daily Room
```bash
curl -X POST http://localhost:8000/api/voice/rooms \
  -H "Content-Type: application/json" \
  -H "Accept: application/json"
```

### Check Health
```bash
curl http://localhost:8000/health
```

## Project Structure

```
backend/
├── api/              # API endpoints
│   └── voice.py      # Voice/WebRTC endpoints
├── core/             # Core configuration
│   └── config.py     # Settings and environment
├── services/         # Business logic
│   └── daily_service.py  # Daily.co integration
├── main.py           # FastAPI application
├── run.py            # Development server runner
├── pyproject.toml    # Project dependencies (uv)
└── uv.lock          # Locked dependencies
```

## Dependencies

Main dependencies:
- **FastAPI**: Web framework
- **Uvicorn**: ASGI server
- **Pipecat**: Daily.co WebRTC integration
- **Pydantic**: Data validation
- **Aiohttp**: Async HTTP client

Development tools:
- **Ruff**: Linting and formatting
- **Mypy**: Type checking
- **Pytest**: Testing framework
- **Pytest-asyncio**: Async test support