import logging
import os
from typing import Any

from convex import ConvexClient
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/flows", tags=["flows"])

logger = logging.getLogger(__name__)

# Initialize Convex client
# The deployment URL should be set in environment variable CONVEX_URL
CONVEX_URL = os.getenv("CONVEX_URL", "https://scintillating-ptarmigan-513.convex.cloud")
client = ConvexClient(CONVEX_URL)


class FlowData(BaseModel):
    id: str
    name: str
    description: str | None = None
    paradigm: str  # "Agentic" or "Sequential"
    nodes: list[dict[str, Any]]
    edges: list[dict[str, Any]]
    version: str
    created: str | None = None
    updated: str | None = None
    metadata: dict[str, Any] | None = None


class FlowCreateResponse(BaseModel):
    flowId: str


@router.post("", response_model=FlowCreateResponse)
async def create_or_update_flow(flow_data: FlowData) -> FlowCreateResponse:
    """
    Store or revise a flow JSON.

    Args:
        flow_data: Flow data to store

    Returns:
        FlowCreateResponse: Object containing the flow ID
    """
    try:
        # Convert Pydantic model to dict for Convex
        flow_dict = flow_data.model_dump(exclude_none=True)

        if logger.isEnabledFor(logging.DEBUG):
            logger.debug(f"Storing flow: {flow_dict}")

        # Call Convex mutation to create or update flow
        result = client.mutation("flows:createFlow", {"flowData": flow_dict})

        return FlowCreateResponse(flowId=result["flowId"])

    except Exception as e:
        logger.exception("Failed to store flow")
        raise HTTPException(status_code=500, detail=f"Failed to store flow: {e!s}") from e


@router.get("/{flow_id}")
async def get_flow(flow_id: str) -> dict[str, Any]:
    """
    Fetch flow JSON by ID.

    Args:
        flow_id: The ID of the flow to retrieve

    Returns:
        dict: The flow data
    """
    try:
        # Call Convex query to get flow
        flow_data = client.query("flows:getFlow", {"flowId": flow_id})

        if flow_data is None:
            raise HTTPException(status_code=404, detail=f"Flow {flow_id} not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to retrieve flow {flow_id}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve flow: {e!s}") from e
    else:
        return flow_data  # type: ignore[no-any-return]


@router.get("")
async def list_flows() -> list[dict[str, Any]]:
    """
    List all flows.

    Returns:
        list: List of flows
    """
    try:
        # Call Convex query to list flows
        flows = client.query("flows:listFlows")
    except Exception as e:
        logger.exception("Failed to list flows")
        raise HTTPException(status_code=500, detail=f"Failed to list flows: {e!s}") from e
    else:
        return flows or []
