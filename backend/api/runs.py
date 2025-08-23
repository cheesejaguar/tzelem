import asyncio
import json
import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from starlette.responses import StreamingResponse

router = APIRouter(prefix="/api/runs", tags=["runs"])

logger = logging.getLogger(__name__)


class VoiceInfo(BaseModel):
    room: str
    token: str | None = None


class RunStartRequest(BaseModel):
    flowId: str | None = None
    flow: dict[str, Any] | None = None


class RunStartResponse(BaseModel):
    runId: str
    voice: VoiceInfo


class RunStatus(BaseModel):
    id: str
    status: str  # "pending", "running", "completed", "failed"
    flowId: str | None = None
    startedAt: str | None = None
    completedAt: str | None = None
    currentNode: str | None = None
    progress: float | None = None  # 0.0 to 1.0


@router.post("", response_model=RunStartResponse)
async def start_run(request: RunStartRequest):
    """
    Start a new run with either a flow ID or full flow JSON.

    Args:
        request: Contains either flowId or full flow JSON

    Returns:
        RunStartResponse: Object containing run ID and voice connection info
    """
    try:
        # Validate that either flowId or flow is provided
        if not request.flowId and not request.flow:
            raise HTTPException(
                status_code=400,
                detail="Either flowId or flow JSON must be provided",
            )

        # TODO: Implement actual run initialization logic
        # For now, return stubbed response
        run_id = "run_789012"  # Placeholder ID

        # Stubbed voice room info
        voice_info = VoiceInfo(
            room="https://daily.co/room-abc123",
            token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  # Placeholder token
        )

        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(
                f"Starting run with flowId: {request.flowId} or flow: {request.flow}"
            )

        return RunStartResponse(runId=run_id, voice=voice_info)

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to start run")
        raise HTTPException(status_code=500, detail="Failed to start run") from e


@router.get("/{run_id}", response_model=RunStatus)
async def get_run_status(run_id: str):
    """
    Get status snapshot for a specific run.

    Args:
        run_id: The ID of the run to get status for

    Returns:
        RunStatus: Current status of the run
    """
    try:
        # TODO: Implement actual status retrieval logic
        # For now, return stubbed response
        if run_id == "run_789012":
            return RunStatus(
                id=run_id,
                status="running",
                flowId="flow_123456",
                startedAt="2025-08-23T10:00:00Z",
                completedAt=None,
                currentNode="agent_node_1",
                progress=0.45,
            )
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to get status for run {run_id}")
        raise HTTPException(status_code=500, detail="Failed to get run status") from e


async def generate_sse_events(run_id: str):
    """
    Generate Server-Sent Events for a run.

    Args:
        run_id: The ID of the run to stream events for

    Yields:
        SSE formatted event strings
    """
    try:
        # TODO: Implement actual event streaming logic
        # For now, generate some sample events
        events = [
            {
                "type": "run_started",
                "runId": run_id,
                "timestamp": "2025-08-23T10:00:00Z",
            },
            {
                "type": "node_started",
                "nodeId": "agent_node_1",
                "timestamp": "2025-08-23T10:00:01Z",
            },
            {"type": "progress", "progress": 0.25, "timestamp": "2025-08-23T10:00:05Z"},
            {
                "type": "node_completed",
                "nodeId": "agent_node_1",
                "timestamp": "2025-08-23T10:00:10Z",
            },
            {
                "type": "node_started",
                "nodeId": "agent_node_2",
                "timestamp": "2025-08-23T10:00:11Z",
            },
            {"type": "progress", "progress": 0.50, "timestamp": "2025-08-23T10:00:15Z"},
        ]

        for event in events:
            # Format as SSE
            event_data = json.dumps(event)
            yield f"data: {event_data}\n\n"
            await asyncio.sleep(1)  # Simulate real-time events

        # Send final completion event
        completion_event = {
            "type": "run_completed",
            "runId": run_id,
            "status": "completed",
            "timestamp": "2025-08-23T10:00:30Z",
        }
        yield f"data: {json.dumps(completion_event)}\n\n"

    except Exception as e:
        logger.exception(f"Error streaming events for run {run_id}")
        error_event = {"type": "error", "message": str(e)}
        yield f"data: {json.dumps(error_event)}\n\n"


@router.get("/{run_id}/events")
async def stream_run_events(run_id: str):
    """
    Stream Server-Sent Events for a specific run.

    Args:
        run_id: The ID of the run to stream events for

    Returns:
        StreamingResponse: SSE stream of run events
    """
    try:
        # TODO: Validate that the run exists
        # For now, accept any run_id for stubbing purposes

        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(f"Starting SSE stream for run {run_id}")

        return StreamingResponse(
            generate_sse_events(run_id),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable Nginx buffering
            },
        )

    except Exception as e:
        logger.exception(f"Failed to start event stream for run {run_id}")
        raise HTTPException(
            status_code=500, detail="Failed to start event stream"
        ) from e
