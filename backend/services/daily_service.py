import logging
from pathlib import Path

import aiohttp
from dotenv import load_dotenv
from pipecat.transports.services.helpers.daily_rest import (
    DailyRESTHelper,
    DailyRoomParams,
)

from core.config import settings

# Load .env file from repository root
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)

logger = logging.getLogger(__name__)


async def create_room() -> tuple[str, str]:
    """
    Create a Daily WebRTC room using Pipecat.
    
    Returns:
        Tuple[str, str]: A tuple containing (room_url, join_token)
    """
    async with aiohttp.ClientSession() as session:
        daily_helper = DailyRESTHelper(
            daily_api_key=settings.daily_api_key,
            aiohttp_session=session,
        )

        # Create room with default parameters
        params = DailyRoomParams()
        room = await daily_helper.create_room(params)
        room_url = room.url

        # Create token with permissions
        token = await daily_helper.get_token(room_url, expiry_time=3600)

        if settings.debug:
            logger.debug(f"Created Daily room: {room_url}")
            token_preview = f"{token[:20]}..." if len(token) > 20 else token
            logger.debug(f"Join token: {token_preview}")

        return room_url, token
