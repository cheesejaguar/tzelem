from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from api.voice import router as voice_router
from core.config import settings

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Tzelem Backend",
    description="Backend API for Tzelem multi-agent orchestration platform",
    version="0.1.0",
    debug=settings.debug
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(voice_router)


@app.get("/")
async def root():
    """Root endpoint for health check"""
    return {"status": "ok", "service": "Tzelem Backend"}


@app.get("/health")
async def health_check():
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
