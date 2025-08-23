import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from services.daily_service import create_room


class TestDailyService:
    """Test suite for Daily.co service integration."""

    @pytest.mark.asyncio
    async def test_create_room_success(self):
        """Test successful room creation via Daily API."""
        mock_room_url = "https://example.daily.co/test-room"
        mock_token = "test-join-token-123456"

        # Mock the room object
        mock_room = MagicMock()
        mock_room.url = mock_room_url

        with patch("services.daily_service.DailyRESTHelper") as MockHelper:
            mock_helper_instance = AsyncMock()
            MockHelper.return_value = mock_helper_instance

            # Setup mock returns
            mock_helper_instance.create_room = AsyncMock(return_value=mock_room)
            mock_helper_instance.get_token = AsyncMock(return_value=mock_token)

            # Call the function
            room_url, token = await create_room()

            # Assertions
            assert room_url == mock_room_url
            assert token == mock_token

            # Verify calls were made
            mock_helper_instance.create_room.assert_called_once()
            mock_helper_instance.get_token.assert_called_once_with(
                mock_room_url,
                expiry_time=3600,
            )

    @pytest.mark.asyncio
    async def test_create_room_with_debug_logging(self):
        """Test room creation with debug logging enabled."""
        mock_room_url = "https://example.daily.co/debug-room"
        mock_token = "debug-token-very-long-string-that-should-be-truncated"

        mock_room = MagicMock()
        mock_room.url = mock_room_url

        with patch("services.daily_service.DailyRESTHelper") as MockHelper:
            mock_helper_instance = AsyncMock()
            MockHelper.return_value = mock_helper_instance

            mock_helper_instance.create_room = AsyncMock(return_value=mock_room)
            mock_helper_instance.get_token = AsyncMock(return_value=mock_token)

            with patch("services.daily_service.settings.debug", True):
                with patch("services.daily_service.logger") as mock_logger:
                    room_url, token = await create_room()

                    # Check debug logs were called
                    mock_logger.debug.assert_any_call(
                        f"Created Daily room: {mock_room_url}",
                    )
                    mock_logger.debug.assert_any_call(
                        f"Join token: {mock_token[:20]}...",
                    )

    @pytest.mark.asyncio
    async def test_create_room_api_failure(self):
        """Test handling of Daily API failures."""
        with patch("services.daily_service.DailyRESTHelper") as MockHelper:
            mock_helper_instance = AsyncMock()
            MockHelper.return_value = mock_helper_instance

            # Simulate API failure
            mock_helper_instance.create_room = AsyncMock(
                side_effect=Exception("Daily API error: Invalid API key"),
            )

            # Should raise the exception
            with pytest.raises(Exception, match="Daily API error: Invalid API key"):
                await create_room()

    @pytest.mark.asyncio
    async def test_create_room_token_failure(self):
        """Test handling of token generation failures."""
        mock_room_url = "https://example.daily.co/test-room"
        mock_room = MagicMock()
        mock_room.url = mock_room_url

        with patch("services.daily_service.DailyRESTHelper") as MockHelper:
            mock_helper_instance = AsyncMock()
            MockHelper.return_value = mock_helper_instance

            mock_helper_instance.create_room = AsyncMock(return_value=mock_room)
            mock_helper_instance.get_token = AsyncMock(
                side_effect=Exception("Token generation failed"),
            )

            with pytest.raises(Exception, match="Token generation failed"):
                await create_room()

    @pytest.mark.asyncio
    async def test_create_room_with_custom_settings(self):
        """Test room creation uses correct settings."""
        mock_api_key = "test-api-key-123"
        mock_room_url = "https://example.daily.co/custom-room"
        mock_token = "custom-token"

        mock_room = MagicMock()
        mock_room.url = mock_room_url

        with patch("services.daily_service.settings.daily_api_key", mock_api_key):
            with patch("services.daily_service.DailyRESTHelper") as MockHelper:
                mock_helper_instance = AsyncMock()
                MockHelper.return_value = mock_helper_instance

                mock_helper_instance.create_room = AsyncMock(return_value=mock_room)
                mock_helper_instance.get_token = AsyncMock(return_value=mock_token)

                await create_room()

                # Verify DailyRESTHelper was initialized with correct API key
                MockHelper.assert_called_once()
                call_kwargs = MockHelper.call_args.kwargs
                assert call_kwargs["daily_api_key"] == mock_api_key
