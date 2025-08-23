from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging
from services.daily_service import create_room
from core.config import settings

router = APIRouter(prefix="/api/voice", tags=["voice"])

logger = logging.getLogger(__name__)


class RoomResponse(BaseModel):
    room: str
    joinToken: str


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
            print(f"[DEBUG] Room created: {room_url}")
        
        return RoomResponse(room=room_url, joinToken=token)
    
    except Exception as e:
        logger.error(f"Failed to create room: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create room")