#!/usr/bin/env python3
"""
Startup script for the Tzelem Backend FastAPI server
"""
import uvicorn

from core.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
    )
