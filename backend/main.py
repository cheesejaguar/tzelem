#!/usr/bin/env python3
import logging

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from api.flows import router as flows_router
from api.mail import router as mail_router
from api.runs import router as runs_router
from api.voice import router as voice_router
from core.config import settings
from core.rate_limiter import (
    create_rate_limit_exceeded_handler,
    limiter,
)

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Tzelem Backend",
    description="Backend API for Tzelem multi-agent orchestration platform",
    version="0.1.0",
    debug=settings.debug,
)

# Add rate limiter to the app state
app.state.limiter = limiter

# Add rate limit exceeded handler
app.add_exception_handler(RateLimitExceeded, create_rate_limit_exceeded_handler())

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voice_router)
app.include_router(flows_router)
app.include_router(runs_router)
app.include_router(mail_router)


@app.get("/")
@limiter.limit("200 per minute")
async def root(request: Request, response: Response):
    """Root endpoint for health check"""
    return {"status": "ok", "service": "Tzelem Backend"}


@app.get("/health")
@limiter.limit("200 per minute")
async def health_check(request: Request, response: Response):
    """Health check endpoint"""
    return {"status": "healthy", "debug": settings.debug}


@app.on_event("startup")
async def startup_event():
    logger.info("Tzelem Backend starting...")
    if settings.debug:
        logger.debug("Debug mode is enabled")
    logger.info("Server ready to accept connections")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Tzelem Backend shutting down...")


# Handle OPTIONS requests for CORS preflight
@app.options("/{path:path}")
@limiter.exempt
async def options_handler(request: Request):
    """Handle CORS preflight requests - exempt from rate limiting"""
    return {"status": "ok"}
