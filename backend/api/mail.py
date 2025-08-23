import logging
import os
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

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
async def send_mail(mail_data: MailRequest) -> MailResponse:
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
                message="Email mocked in development mode"
            )
        
        raise HTTPException(
            status_code=503, 
            detail="Mail service not available - check AGENTMAIL_API_KEY and installation"
        )

    try:
        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(f"Sending mail to: {mail_data.to}, subject: {mail_data.subject}")

        # Prepare email data for AgentMail
        email_data = {
            "to": mail_data.to,
            "subject": mail_data.subject,
        }
        
        # Add from_name if provided
        if mail_data.from_name:
            email_data["from_name"] = mail_data.from_name
        
        # Add content (prefer HTML if both provided)
        if mail_data.html:
            email_data["html"] = mail_data.html
        elif mail_data.text:
            email_data["text"] = mail_data.text
        else:
            raise HTTPException(
                status_code=400, 
                detail="Either html or text content must be provided"
            )

        # Send email via AgentMail
        # Note: Using the inboxes.create method as shown in the documentation
        response = client.inboxes.create(**email_data)

        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(f"Mail sent successfully: {response}")

        return MailResponse(
            messageId=getattr(response, 'id', None),
            status="queued",
            message="Email sent successfully"
        )

    except Exception as e:
        logger.exception(f"Failed to send mail to {mail_data.to}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to send mail: {e!s}"
        ) from e


@router.get("/health")
async def mail_health() -> dict[str, Any]:
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
        "mock_mode": os.getenv("DEBUG") == "true" and not client
    }