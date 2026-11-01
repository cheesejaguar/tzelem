import sys
from collections.abc import Generator
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from pipecat.transports.services.helpers.daily_rest import DailyRoomParams

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from api.voice import RoomResponse
from main import app


@pytest.fixture
def daily_helper() -> Generator[AsyncMock, None, None]:
    """Mock only the Daily REST client (third-party network API).

    The repo's own ``services.daily_service.create_room`` runs for real.
    """
    with patch("services.daily_service.DailyRESTHelper") as mock_helper_cls:
        helper = AsyncMock()
        mock_helper_cls.return_value = helper
        yield helper


class TestVoiceAPI:
    """Test suite for voice API endpoints."""

    @pytest.mark.asyncio
    async def test_create_voice_room_success(self, daily_helper: AsyncMock):
        """Test successful room creation."""
        mock_room_url = "https://example.daily.co/test-room"
        mock_token = "test-token-123"
        room = MagicMock()
        room.url = mock_room_url
        daily_helper.create_room.return_value = room
        daily_helper.get_token.return_value = mock_token

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as ac:
            response = await ac.post("/api/voice/rooms")

        assert response.status_code == 200
        assert response.json() == {"room": mock_room_url, "join_token": mock_token}
        daily_helper.create_room.assert_awaited_once()
        (params,) = daily_helper.create_room.await_args.args
        assert isinstance(params, DailyRoomParams)
        daily_helper.get_token.assert_awaited_once_with(mock_room_url, expiry_time=3600)

    @pytest.mark.asyncio
    async def test_create_voice_room_failure(self, daily_helper: AsyncMock):
        """Test room creation failure handling."""
        daily_helper.create_room.side_effect = Exception("Daily API error")

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as ac:
            response = await ac.post("/api/voice/rooms")

        assert response.status_code == 500
        assert response.json() == {"detail": "Failed to create room"}
        daily_helper.get_token.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_create_voice_room_debug_mode(self, daily_helper: AsyncMock, capsys):
        """Test room creation with debug mode enabled prints the created room."""
        mock_room_url = "https://example.daily.co/debug-room"
        mock_token = "debug-token-456"
        room = MagicMock()
        room.url = mock_room_url
        daily_helper.create_room.return_value = room
        daily_helper.get_token.return_value = mock_token

        with patch("api.voice.settings.debug", True):
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as ac:
                response = await ac.post("/api/voice/rooms")

        assert response.status_code == 200
        assert response.json() == {"room": mock_room_url, "join_token": mock_token}
        assert f"[DEBUG] Room created: {mock_room_url}" in capsys.readouterr().out

    def test_room_response_model(self):
        """Test RoomResponse Pydantic model validation."""
        # Valid response
        response = RoomResponse(
            room="https://example.daily.co/room",
            join_token="token123",
        )
        assert response.room == "https://example.daily.co/room"
        assert response.join_token == "token123"

        # Test model validation with dict
        response_dict = {
            "room": "https://example.daily.co/room2",
            "join_token": "token456",
        }
        response = RoomResponse(**response_dict)
        assert response.room == "https://example.daily.co/room2"
        assert response.join_token == "token456"
