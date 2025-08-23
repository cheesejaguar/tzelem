import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.config import settings
from services.daily_service import create_room

router = APIRouter(prefix="/api/voice", tags=["voice"])

logger = logging.getLogger(__name__)


class RoomResponse(BaseModel):
    room: str
    join_token: str


@router.post("/rooms", response_model=RoomResponse)
async def create_voice_room():
    """
    Create a new Daily WebRTC room.

    Returns:
        RoomResponse: Object containing room URL and join token
    """
    try:
        room_url, token = await create_room()

        if settings.debug:
            pass

        return RoomResponse(room=room_url, join_token=token)

    except Exception as e:
        logger.exception("Failed to create room")
        raise HTTPException(status_code=500, detail="Failed to create room") from e
