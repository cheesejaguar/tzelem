import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient
import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from main import app
from api.voice import RoomResponse

client = TestClient(app)


class TestVoiceAPI:
    """Test suite for voice API endpoints."""
    
    @pytest.mark.asyncio
    async def test_create_voice_room_success(self):
        """Test successful room creation."""
        mock_room_url = "https://example.daily.co/test-room"
        mock_token = "test-token-123"
        
        with patch("api.voice.create_room", new_callable=AsyncMock) as mock_create:
            mock_create.return_value = (mock_room_url, mock_token)
            
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                response = await ac.post("/api/voice/rooms")
            
            assert response.status_code == 200
            data = response.json()
            assert data["room"] == mock_room_url
            assert data["joinToken"] == mock_token
            mock_create.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_create_voice_room_failure(self):
        """Test room creation failure handling."""
        with patch("api.voice.create_room", new_callable=AsyncMock) as mock_create:
            mock_create.side_effect = Exception("Daily API error")
            
            async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                response = await ac.post("/api/voice/rooms")
            
            assert response.status_code == 500
            data = response.json()
            assert data["detail"] == "Failed to create room"
            mock_create.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_create_voice_room_debug_mode(self):
        """Test room creation with debug mode enabled."""
        mock_room_url = "https://example.daily.co/debug-room"
        mock_token = "debug-token-456"
        
        with patch("api.voice.create_room", new_callable=AsyncMock) as mock_create:
            mock_create.return_value = (mock_room_url, mock_token)
            
            with patch("api.voice.settings.debug", True):
                with patch("builtins.print") as mock_print:
                    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                        response = await ac.post("/api/voice/rooms")
                    
                    assert response.status_code == 200
                    mock_print.assert_called_with(f"[DEBUG] Room created: {mock_room_url}")
    
    def test_room_response_model(self):
        """Test RoomResponse Pydantic model validation."""
        # Valid response
        response = RoomResponse(
            room="https://example.daily.co/room",
            joinToken="token123"
        )
        assert response.room == "https://example.daily.co/room"
        assert response.joinToken == "token123"
        
        # Test model validation with dict
        response_dict = {
            "room": "https://example.daily.co/room2",
            "joinToken": "token456"
        }
        response = RoomResponse(**response_dict)
        assert response.room == "https://example.daily.co/room2"
        assert response.joinToken == "token456"