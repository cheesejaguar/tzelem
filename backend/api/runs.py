import asyncio
import json
import logging
from typing import Any, Optional
from datetime import datetime
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from starlette.responses import StreamingResponse

# Import our execution engine and flow translator
from core.flow_translator import translate_flow_to_backend, FlowTranslationError
from core.JSON_flow_agent import JSONFlowAgent
try:
    from core.JSON_flow_agent_sequential import SequentialJSONFlowAgent
except ImportError:
    SequentialJSONFlowAgent = None
from services.daily_service import create_room

router = APIRouter(prefix="/api/runs", tags=["runs"])

logger = logging.getLogger(__name__)

# Global storage for active runs
active_runs = {}
run_events = {}


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

        # Generate unique run ID
        run_id = str(uuid.uuid4())
        
        # Get flow data (either from ID lookup or direct JSON)
        flow_data = None
        if request.flow:
            flow_data = request.flow
        else:
            # TODO: Implement flow lookup by ID from database
            raise HTTPException(
                status_code=400,
                detail="Flow lookup by ID not yet implemented. Please provide flow JSON directly."
            )

        logger.info(f"Starting run {run_id} with flow data: {json.dumps(flow_data, indent=2)}")

        # Extract flow information
        paradigm = flow_data.get("paradigm", "Agentic")
        nodes = flow_data.get("nodes", [])
        edges = flow_data.get("edges", [])
        voice_enabled = flow_data.get("voice", {}).get("enabled", False)

        # Translate frontend flow to backend agent configuration
        try:
            agent_config = translate_flow_to_backend(paradigm, nodes, edges)
            logger.info(f"Translated flow to agent config: {json.dumps(agent_config, indent=2)}")
        except FlowTranslationError as e:
            logger.error(f"Flow translation failed: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid flow structure: {str(e)}")

        # Create voice room if needed
        room_url = None
        token = None
        
        if voice_enabled:
            try:
                room_url, token = await create_room()
                logger.info(f"Created voice room: {room_url}")
            except Exception as e:
                logger.error(f"Failed to create voice room: {e}")
                raise HTTPException(status_code=500, detail="Failed to create voice room")

        # Store run information
        run_info = {
            "id": run_id,
            "status": "starting",
            "flowId": request.flowId,
            "flowData": flow_data,
            "agentConfig": agent_config,
            "paradigm": paradigm,
            "voiceEnabled": voice_enabled,
            "room": room_url,
            "token": token,
            "startedAt": datetime.utcnow().isoformat(),
            "agent": None,
            "events": []
        }
        
        active_runs[run_id] = run_info
        run_events[run_id] = []

        # Start agent execution in background
        asyncio.create_task(execute_run_agent(run_id))

        # Prepare response
        voice_info = VoiceInfo(
            room=room_url or "https://daily.co/room-headless",
            token=token or "headless-mode"
        )

        logger.info(f"Run {run_id} started successfully")
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
        # Get run from active runs
        run_info = active_runs.get(run_id)
        if not run_info:
            raise HTTPException(status_code=404, detail=f"Run {run_id} not found")

        return RunStatus(
            id=run_id,
            status=run_info.get("status", "unknown"),
            flowId=run_info.get("flowId"),
            startedAt=run_info.get("startedAt"),
            completedAt=run_info.get("completedAt"),
            currentNode=run_info.get("currentNode"),
            progress=run_info.get("progress", 0.0),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to get status for run {run_id}")
        raise HTTPException(status_code=500, detail="Failed to get run status") from e


async def execute_run_agent(run_id: str):
    """
    Execute the agent for a specific run in background.
    
    Args:
        run_id: The ID of the run to execute
    """
    try:
        run_info = active_runs.get(run_id)
        if not run_info:
            logger.error(f"Run {run_id} not found for execution")
            return

        # Update status
        run_info["status"] = "running"
        add_run_event(run_id, "run_started", {"runId": run_id})

        agent_config = run_info["agentConfig"]
        paradigm = run_info["paradigm"]
        voice_enabled = run_info["voiceEnabled"]
        
        logger.info(f"Executing {paradigm} agent for run {run_id}, voice_enabled={voice_enabled}")

        if voice_enabled and run_info["room"] and run_info["token"]:
            # Execute with voice
            if paradigm.lower() == "agentic":
                agent = JSONFlowAgent(agent_config)
                run_info["agent"] = agent
                
                # Create flow pipeline 
                flow_info = await agent.create_flow_pipeline(
                    run_info["room"], 
                    run_info["token"]
                )
                
                add_run_event(run_id, "agent_initialized", {
                    "paradigm": flow_info["paradigm"],
                    "subAgentsCount": flow_info.get("sub_agents_count", 0)
                })
                
                # Run the agent
                await agent.run_flow()
                
            elif paradigm.lower() == "sequential" and SequentialJSONFlowAgent:
                agent = SequentialJSONFlowAgent(agent_config)
                run_info["agent"] = agent
                
                # Create flow pipeline
                flow_info = await agent.create_flow_pipeline(
                    run_info["room"],
                    run_info["token"] 
                )
                
                add_run_event(run_id, "agent_initialized", {
                    "paradigm": flow_info["paradigm"], 
                    "agentsCount": flow_info.get("agents_count", 0)
                })
                
                # Run the agent
                await agent.run_flow()
            
            else:
                raise Exception(f"Unsupported paradigm for voice execution: {paradigm}")
        
        else:
            # Execute headless (simulate execution for now)
            await simulate_headless_execution(run_id)

        # Mark as completed
        run_info["status"] = "completed"
        run_info["completedAt"] = datetime.utcnow().isoformat()
        run_info["progress"] = 1.0
        
        add_run_event(run_id, "run_completed", {
            "runId": run_id,
            "status": "completed"
        })
        
        logger.info(f"Run {run_id} completed successfully")

    except Exception as e:
        logger.exception(f"Error executing run {run_id}")
        if run_id in active_runs:
            active_runs[run_id]["status"] = "failed"
            active_runs[run_id]["completedAt"] = datetime.utcnow().isoformat()
            add_run_event(run_id, "run_failed", {
                "runId": run_id,
                "error": str(e)
            })

async def simulate_headless_execution(run_id: str):
    """Simulate headless execution for testing purposes"""
    run_info = active_runs.get(run_id)
    if not run_info:
        return
        
    nodes = run_info["flowData"].get("nodes", [])
    total_nodes = len(nodes)
    
    if total_nodes == 0:
        add_run_event(run_id, "no_nodes", {"message": "No nodes to execute"})
        return
    
    # Simulate node execution
    for i, node in enumerate(nodes):
        node_id = node.get("id", f"node_{i}")
        node_type = node.get("type", "unknown")
        
        run_info["currentNode"] = node_id
        run_info["progress"] = (i + 0.5) / total_nodes
        
        add_run_event(run_id, "node_started", {
            "nodeId": node_id,
            "nodeType": node_type,
            "progress": run_info["progress"]
        })
        
        # Simulate processing time
        await asyncio.sleep(2)
        
        run_info["progress"] = (i + 1) / total_nodes
        
        add_run_event(run_id, "node_completed", {
            "nodeId": node_id,
            "nodeType": node_type, 
            "progress": run_info["progress"]
        })

def add_run_event(run_id: str, event_type: str, data: dict):
    """Add an event to the run's event stream"""
    event = {
        "type": event_type,
        "timestamp": datetime.utcnow().isoformat(),
        "runId": run_id,
        **data
    }
    
    if run_id not in run_events:
        run_events[run_id] = []
    
    run_events[run_id].append(event)
    
    # Store in run info as well
    if run_id in active_runs:
        if "events" not in active_runs[run_id]:
            active_runs[run_id]["events"] = []
        active_runs[run_id]["events"].append(event)

async def generate_sse_events(run_id: str):
    """
    Generate Server-Sent Events for a run.

    Args:
        run_id: The ID of the run to stream events for

    Yields:
        SSE formatted event strings
    """
    try:
        # Check if run exists
        if run_id not in active_runs:
            error_event = {"type": "error", "message": f"Run {run_id} not found"}
            yield f"data: {json.dumps(error_event)}\n\n"
            return

        # Get existing events
        events = run_events.get(run_id, [])
        sent_count = 0
        
        # Send existing events first
        for event in events:
            event_data = json.dumps(event)
            yield f"data: {event_data}\n\n"
            sent_count += 1

        # Stream new events as they come in
        while True:
            current_events = run_events.get(run_id, [])
            
            # Send any new events
            for i in range(sent_count, len(current_events)):
                event = current_events[i]
                event_data = json.dumps(event)
                yield f"data: {event_data}\n\n"
                sent_count += 1
                
                # Break if run completed or failed
                if event.get("type") in ["run_completed", "run_failed"]:
                    return
            
            # Wait before checking for more events
            await asyncio.sleep(1)
            
            # Break if run no longer exists
            if run_id not in active_runs:
                break

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
        raise HTTPException(status_code=500, detail="Failed to start event stream") from e
