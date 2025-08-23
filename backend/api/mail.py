import logging
import os
import time
from typing import Any

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel

from core.rate_limiter import get_mail_limit, limiter

# Import AgentMail client
try:
    from agentmail import AgentMail
except ImportError:
    # Fallback for development/testing
    AgentMail = None

router = APIRouter(prefix="/api/mail", tags=["mail"])

logger = logging.getLogger(__name__)

# Initialize AgentMail client
AGENTMAIL_API_KEY = os.getenv("AGENTMAIL_API_KEY")
if AGENTMAIL_API_KEY and AgentMail:
    client = AgentMail(api_key=AGENTMAIL_API_KEY)
else:
    client = None
    if not AGENTMAIL_API_KEY:
        logger.warning("AGENTMAIL_API_KEY not set - mail functionality disabled")
    if not AgentMail:
        logger.warning("AgentMail library not installed - mail functionality disabled")


class MailRequest(BaseModel):
    to: str
    subject: str
    html: str | None = None
    text: str | None = None
    from_name: str | None = None


class MailResponse(BaseModel):
    messageId: str | None = None
    status: str
    message: str


@router.post("", response_model=MailResponse)
@limiter.limit(get_mail_limit)
async def send_mail(request: Request, response: Response, mail_data: MailRequest) -> MailResponse:
    """
    Send email via AgentMail.

    Args:
        mail_data: Email data including recipient, subject, and content

    Returns:
        MailResponse: Object containing the email status
    """
    if not client:
        # Return a mock response in development
        if os.getenv("DEBUG") == "true":
            logger.info(f"[MOCK] Would send mail to: {mail_data.to}, subject: {mail_data.subject}")
            return MailResponse(
                messageId="mock-" + str(hash(mail_data.to + mail_data.subject)),
                status="mocked",
                message="Email mocked in development mode",
            )

        raise HTTPException(
            status_code=503,
            detail="Mail service not available - check AGENTMAIL_API_KEY and installation",
        )

    try:
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(f"Sending mail to: {mail_data.to}, subject: {mail_data.subject}")

        # Check if content is provided
        if not mail_data.html and not mail_data.text:
            raise HTTPException(
                status_code=400, detail="Either html or text content must be provided"
            )

        # Get or create an inbox for sending
        # For AgentMail, we need the inbox_id (which is the email address)
        inbox_id = os.getenv("AGENTMAIL_INBOX_ID")
        if not inbox_id:
            # Create a default inbox if not configured
            try:
                inbox = client.inboxes.create(display_name=mail_data.from_name or "Tzelem")
                # The inbox_id is the email address
                inbox_id = inbox.inbox_id
                logger.info(f"Created AgentMail inbox: {inbox_id}")

                # Wait a moment for the inbox to be available
                time.sleep(2)
            except Exception as e:
                logger.error(f"Failed to create inbox: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to create mail inbox: {e!s}")

        # Send email via AgentMail
        response = client.inboxes.messages.send(
            inbox_id=inbox_id,  # This is the email address
            to=mail_data.to,
            subject=mail_data.subject,
            html=mail_data.html,
            text=mail_data.text,
        )

        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(f"Mail sent successfully: {response}")

        return MailResponse(
            messageId=getattr(response, "message_id", None),
            status="queued",
            message="Email sent successfully",
        )

    except HTTPException:
        # Re-raise HTTPException without wrapping it
        raise
    except Exception as e:
        logger.exception(f"Failed to send mail to {mail_data.to}")
        raise HTTPException(status_code=500, detail=f"Failed to send mail: {e!s}") from e


@router.get("/health")
@limiter.limit("100 per minute")
async def mail_health(request: Request, response: Response) -> dict[str, Any]:
    """
    Check mail service health.

    Returns:
        dict: Health status of the mail service
    """
    return {
        "status": "healthy" if client else "unavailable",
        "agentmail_installed": AgentMail is not None,
        "api_key_configured": bool(AGENTMAIL_API_KEY),
        "message": "Mail service is ready" if client else "Mail service not configured",
        "mock_mode": os.getenv("DEBUG") == "true" and not client,
    }
