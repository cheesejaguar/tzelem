import os
import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from api.mail import MailRequest, MailResponse
from main import app

client = TestClient(app)


class TestMailAPI:
    """Test suite for mail API endpoints."""

    @pytest.mark.asyncio
    async def test_send_mail_success(self):
        """Test successful email sending."""
        mock_response = MagicMock()
        mock_response.id = "msg-12345"

        with patch("api.mail.client") as mock_client:
            mock_client.inboxes.create.return_value = mock_response

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as ac:
                response = await ac.post(
                    "/api/mail",
                    json={
                        "to": "test@example.com",
                        "subject": "Test Email",
                        "html": "<p>Test content</p>",
                        "from_name": "Test Sender",
                    },
                )

            assert response.status_code == 200
            data = response.json()
            assert data["messageId"] == "msg-12345"
            assert data["status"] == "queued"
            assert data["message"] == "Email sent successfully"
            mock_client.inboxes.create.assert_called_once_with(
                to="test@example.com",
                subject="Test Email",
                html="<p>Test content</p>",
                from_name="Test Sender",
            )

    @pytest.mark.asyncio
    async def test_send_mail_text_only(self):
        """Test sending email with text content only."""
        mock_response = MagicMock()
        mock_response.id = "msg-67890"

        with patch("api.mail.client") as mock_client:
            mock_client.inboxes.create.return_value = mock_response

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as ac:
                response = await ac.post(
                    "/api/mail",
                    json={
                        "to": "test@example.com",
                        "subject": "Plain Text Email",
                        "text": "Plain text content",
                    },
                )

            assert response.status_code == 200
            data = response.json()
            assert data["messageId"] == "msg-67890"
            assert data["status"] == "queued"
            mock_client.inboxes.create.assert_called_once_with(
                to="test@example.com",
                subject="Plain Text Email",
                text="Plain text content",
            )

    @pytest.mark.asyncio
    async def test_send_mail_html_preferred_over_text(self):
        """Test that HTML content is preferred when both HTML and text are provided."""
        mock_response = MagicMock()
        mock_response.id = "msg-11111"

        with patch("api.mail.client") as mock_client:
            mock_client.inboxes.create.return_value = mock_response

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as ac:
                response = await ac.post(
                    "/api/mail",
                    json={
                        "to": "test@example.com",
                        "subject": "Test Email",
                        "html": "<p>HTML content</p>",
                        "text": "Text content",
                    },
                )

            assert response.status_code == 200
            # Verify HTML was used, not text
            mock_client.inboxes.create.assert_called_once_with(
                to="test@example.com",
                subject="Test Email",
                html="<p>HTML content</p>",
            )

    @pytest.mark.asyncio
    async def test_send_mail_no_content_error(self):
        """Test error when neither HTML nor text content is provided."""
        with patch("api.mail.client") as mock_client:
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as ac:
                response = await ac.post(
                    "/api/mail",
                    json={
                        "to": "test@example.com",
                        "subject": "Test Email",
                    },
                )

            assert response.status_code == 400
            assert "Either html or text content must be provided" in response.json()["detail"]
            mock_client.inboxes.create.assert_not_called()

    @pytest.mark.asyncio
    async def test_send_mail_no_client_debug_mode(self):
        """Test mock response in debug mode when client is not available."""
        with patch("api.mail.client", None), patch.dict(os.environ, {"DEBUG": "true"}):
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as ac:
                response = await ac.post(
                    "/api/mail",
                    json={
                        "to": "debug@example.com",
                        "subject": "Debug Email",
                        "text": "Debug content",
                    },
                )

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "mocked"
            assert data["message"] == "Email mocked in development mode"
            assert data["messageId"].startswith("mock-")

    @pytest.mark.asyncio
    async def test_send_mail_no_client_no_debug(self):
        """Test error when client is not available and not in debug mode."""
        with patch("api.mail.client", None), patch.dict(os.environ, {"DEBUG": "false"}):
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as ac:
                response = await ac.post(
                    "/api/mail",
                    json={
                        "to": "test@example.com",
                        "subject": "Test Email",
                        "text": "Test content",
                    },
                )

            assert response.status_code == 503
            assert "Mail service not available" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_send_mail_client_exception(self):
        """Test handling of exception from AgentMail client."""
        with patch("api.mail.client") as mock_client:
            mock_client.inboxes.create.side_effect = Exception("AgentMail API error")

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as ac:
                response = await ac.post(
                    "/api/mail",
                    json={
                        "to": "test@example.com",
                        "subject": "Test Email",
                        "html": "<p>Test content</p>",
                    },
                )

            assert response.status_code == 500
            assert "Failed to send mail" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_send_mail_with_response_without_id(self):
        """Test handling response without ID attribute."""
        mock_response = MagicMock()
        del mock_response.id  # Remove the id attribute

        with patch("api.mail.client") as mock_client:
            mock_client.inboxes.create.return_value = mock_response

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as ac:
                response = await ac.post(
                    "/api/mail",
                    json={
                        "to": "test@example.com",
                        "subject": "Test Email",
                        "html": "<p>Test content</p>",
                    },
                )

            assert response.status_code == 200
            data = response.json()
            assert data["messageId"] is None
            assert data["status"] == "queued"
            assert data["message"] == "Email sent successfully"

    @pytest.mark.asyncio
    async def test_mail_health_with_client(self):
        """Test health endpoint when mail client is configured."""
        with (
            patch("api.mail.client", MagicMock()),
            patch("api.mail.AgentMail", MagicMock()),
            patch("api.mail.AGENTMAIL_API_KEY", "test-key"),
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as ac:
                response = await ac.get("/api/mail/health")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["agentmail_installed"] is True
            assert data["api_key_configured"] is True
            assert data["message"] == "Mail service is ready"
            assert data["mock_mode"] is False

    @pytest.mark.asyncio
    async def test_mail_health_without_client(self):
        """Test health endpoint when mail client is not configured."""
        with (
            patch("api.mail.client", None),
            patch("api.mail.AgentMail", None),
            patch("api.mail.AGENTMAIL_API_KEY", None),
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as ac:
                response = await ac.get("/api/mail/health")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "unavailable"
            assert data["agentmail_installed"] is False
            assert data["api_key_configured"] is False
            assert data["message"] == "Mail service not configured"

    @pytest.mark.asyncio
    async def test_mail_health_mock_mode(self):
        """Test health endpoint in mock mode."""
        with (
            patch("api.mail.client", None),
            patch("api.mail.AgentMail", MagicMock()),
            patch("api.mail.AGENTMAIL_API_KEY", None),
            patch.dict(os.environ, {"DEBUG": "true"}),
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as ac:
                response = await ac.get("/api/mail/health")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "unavailable"
            assert data["mock_mode"] is True

    @pytest.mark.asyncio
    async def test_send_mail_validation_error(self):
        """Test validation error for invalid email data."""
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as ac:
            response = await ac.post(
                "/api/mail",
                json={
                    "subject": "Test Email",  # Missing 'to' field
                    "html": "<p>Test content</p>",
                },
            )

        assert response.status_code == 422  # Unprocessable Entity for validation errors

    @pytest.mark.asyncio
    async def test_send_mail_logging(self, caplog):
        """Test that appropriate logging occurs during email sending."""
        mock_response = MagicMock()
        mock_response.id = "msg-log-test"

        with patch("api.mail.client") as mock_client, caplog.at_level("DEBUG"):
            mock_client.inboxes.create.return_value = mock_response

            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as ac:
                await ac.post(
                    "/api/mail",
                    json={
                        "to": "test@example.com",
                        "subject": "Test Email",
                        "html": "<p>Test content</p>",
                    },
                )

            # Check that debug logging occurred (if enabled)
            # Note: This test may need adjustment based on actual logging configuration

    def test_mail_request_model(self):
        """Test MailRequest model validation."""
        # Valid request with all fields
        request = MailRequest(
            to="test@example.com",
            subject="Test",
            html="<p>HTML</p>",
            text="Text",
            from_name="Sender",
        )
        assert request.to == "test@example.com"
        assert request.subject == "Test"
        assert request.html == "<p>HTML</p>"
        assert request.text == "Text"
        assert request.from_name == "Sender"

        # Valid request with minimal fields
        request_minimal = MailRequest(
            to="test@example.com",
            subject="Test",
        )
        assert request_minimal.to == "test@example.com"
        assert request_minimal.subject == "Test"
        assert request_minimal.html is None
        assert request_minimal.text is None
        assert request_minimal.from_name is None

    def test_mail_response_model(self):
        """Test MailResponse model."""
        # Response with all fields
        response = MailResponse(
            messageId="msg-123",
            status="queued",
            message="Success",
        )
        assert response.messageId == "msg-123"
        assert response.status == "queued"
        assert response.message == "Success"

        # Response without messageId
        response_no_id = MailResponse(
            status="error",
            message="Failed",
        )
        assert response_no_id.messageId is None
        assert response_no_id.status == "error"
        assert response_no_id.message == "Failed"
