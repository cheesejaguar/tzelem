import asyncio
import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from core.config import settings
from services.daily_service import create_room

# Make heavy dependencies optional for serverless deployment
try:
    from core.JSON_flow_agent import JSONFlowAgent
    from core.productivity_flow_agent import productivity_flow_agent
    # Temporarily disable sequential agent due to merge conflicts
    # from core.JSON_flow_agent_sequential import SequentialJSONFlowAgent
    SequentialJSONFlowAgent = None
    PIPECAT_AVAILABLE = True
except ImportError:
    JSONFlowAgent = None
    SequentialJSONFlowAgent = None
    productivity_flow_agent = None
    PIPECAT_AVAILABLE = False
    logging.warning("Pipecat dependencies not available - voice agent features disabled")

router = APIRouter(prefix="/api/voice", tags=["voice"])

logger = logging.getLogger(__name__)

# Store active agents
active_agents = {}
active_json_agents = {}
active_sequential_agents = {}


class RoomResponse(BaseModel):
    room: str
    join_token: str


class ProductivityRoomResponse(BaseModel):
    room: str
    joinToken: str
    agentStatus: str
    features: list[str]


class JSONFlowRoomRequest(BaseModel):
    json_config: dict | None = None


class JSONFlowRoomResponse(BaseModel):
    room: str
    joinToken: str
    agentStatus: str
    paradigm: str
    subAgentsCount: int


class SequentialFlowRoomRequest(BaseModel):
    json_config: dict | None = None


class SequentialFlowRoomResponse(BaseModel):
    room: str
    joinToken: str
    agentStatus: str
    paradigm: str
    agentsCount: int


@router.post("/rooms", response_model=RoomResponse)
async def create_voice_room():
    """
    Create a new Daily WebRTC room.

    Returns:
        RoomResponse: Object containing room URL and join token
    """
    try:
        room_url, token = await create_room()

        if settings.debug:
            print(f"[DEBUG] Room created: {room_url}")

        return RoomResponse(room=room_url, join_token=token)

    except Exception as e:
        logger.error(f"Failed to create room: {e!s}")
        raise HTTPException(status_code=500, detail="Failed to create room")


async def run_json_flow_agent(room_url: str, token: str, json_config: dict = None):
    """Background task to run the JSON flow agent."""
    try:
        # Create a new instance with the provided config
        agent = JSONFlowAgent(json_config)

        # Create and configure the flow pipeline
        flow_info = await agent.create_flow_pipeline(
            room_url=room_url,
            token=token,
        )

        # Store the agent info
        active_json_agents[room_url] = {
            "agent": agent,
            "status": "running",
            "paradigm": flow_info["paradigm"],
            "sub_agents_count": flow_info["sub_agents_count"],
            "configuration": flow_info["configuration"],
        }

        logger.info(f"Starting JSON flow agent for room: {room_url}")
        logger.info(f"Agent paradigm: {flow_info['paradigm']}")

        # Run the agent flow
        await agent.run_flow()

    except asyncio.CancelledError:
        logger.info(f"JSON flow agent cancelled for room: {room_url}")
        active_json_agents.pop(room_url, None)
    except Exception as e:
        logger.error(f"Error running JSON flow agent for room {room_url}: {e}")
        if room_url in active_json_agents:
            active_json_agents[room_url]["status"] = "error"


async def run_sequential_flow_agent(room_url: str, token: str, json_config: dict = None):
    """Background task to run the sequential JSON flow agent."""
    if SequentialJSONFlowAgent is None:
        logger.error("Sequential JSON flow agent not available due to import errors")
        return
    try:
        # Create a new instance with the provided config
        agent = SequentialJSONFlowAgent(json_config)

        # Create and configure the flow pipeline
        flow_info = await agent.create_flow_pipeline(
            room_url=room_url,
            token=token,
        )

        # Store the agent info
        active_sequential_agents[room_url] = {
            "agent": agent,
            "status": "running",
            "paradigm": flow_info["paradigm"],
            "agents_count": flow_info["agents_count"],
            "configuration": flow_info["configuration"],
        }

        logger.info(f"Starting Sequential JSON flow agent for room: {room_url}")
        logger.info(f"Agent paradigm: {flow_info['paradigm']}")

        # Run the agent flow
        await agent.run_flow()

    except asyncio.CancelledError:
        logger.info(f"Sequential JSON flow agent cancelled for room: {room_url}")
        active_sequential_agents.pop(room_url, None)
    except Exception as e:
        logger.error(f"Error running Sequential JSON flow agent for room {room_url}: {e}")
        if room_url in active_sequential_agents:
            active_sequential_agents[room_url]["status"] = "error"


async def run_productivity_agent(room_url: str, token: str):
    """Background task to run the productivity agent."""
    try:
        agent = productivity_flow_agent

        # Create and configure the flow pipeline
        flow_info = await agent.create_flow_pipeline(
            room_url=room_url,
            token=token,
        )

        # Store the agent info
        active_agents[room_url] = {
            "agent": agent,
            "status": "running",
            "features": flow_info["features"],
        }

        logger.info(f"Starting productivity agent for room: {room_url}")

        # Run the agent flow
        await agent.run_flow()

    except asyncio.CancelledError:
        logger.info(f"Productivity agent cancelled for room: {room_url}")
        active_agents.pop(room_url, None)
    except Exception as e:
        logger.error(f"Error running productivity agent for room {room_url}: {e}")
        if room_url in active_agents:
            active_agents[room_url]["status"] = "error"


@router.post("/productivity-rooms", response_model=ProductivityRoomResponse)
async def create_productivity_room(background_tasks: BackgroundTasks):
    """
    Create a new Daily WebRTC room with productivity assistant agent.

    Returns:
        ProductivityRoomResponse: Object containing room details and agent info
    """
    if not PIPECAT_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="Voice agent features are not available in this deployment"
        )
        
    try:
        room_url, token = await create_room()

        # Start the productivity agent in the background
        background_tasks.add_task(run_productivity_agent, room_url, token)

        if settings.debug:
            print(f"[DEBUG] Productivity room created: {room_url}")

        return ProductivityRoomResponse(
            room=room_url,
            joinToken=token,
            agentStatus="starting",
            features=[
                "Task Management",
                "Schedule Planning",
                "Goal Setting",
                "Productivity Coaching",
            ],
        )

    except Exception as e:
        logger.error(f"Failed to create productivity room: {e!s}")
        raise HTTPException(status_code=500, detail="Failed to create productivity room")


@router.post("/json-flow-rooms", response_model=JSONFlowRoomResponse)
async def create_json_flow_room(
    request: JSONFlowRoomRequest,
    background_tasks: BackgroundTasks,
):
    """
    Create a new Daily WebRTC room with JSON flow agent.

    Args:
        request: Optional JSON configuration for the agent

    Returns:
        JSONFlowRoomResponse: Object containing room details and agent info
    """
    if not PIPECAT_AVAILABLE:
        raise HTTPException(
            status_code=503, 
            detail="Voice agent features are not available in this deployment"
        )
        
    try:
        room_url, token = await create_room()

        # Start the JSON flow agent in the background
        background_tasks.add_task(
            run_json_flow_agent,
            room_url,
            token,
            request.json_config,
        )

        if settings.debug:
            print(f"[DEBUG] JSON flow room created: {room_url}")
            if request.json_config:
                print(f"[DEBUG] Using custom config: {request.json_config}")

        # Default values for response (will be updated when agent starts)
        paradigm = "Agentic"
        sub_agents_count = 0

        if request.json_config:
            paradigm = request.json_config.get("paradigm", "Agentic")
            sub_agents_count = len(request.json_config.get("subAgents", []))

        return JSONFlowRoomResponse(
            room=room_url,
            joinToken=token,
            agentStatus="starting",
            paradigm=paradigm,
            subAgentsCount=sub_agents_count,
        )

    except Exception as e:
        logger.error(f"Failed to create JSON flow room: {e!s}")
        raise HTTPException(status_code=500, detail="Failed to create JSON flow room")


@router.post("/sequential-flow-rooms", response_model=SequentialFlowRoomResponse)
async def create_sequential_flow_room(
    request: SequentialFlowRoomRequest,
    background_tasks: BackgroundTasks,
):
    """
    Create a new Daily WebRTC room with Sequential JSON flow agent.

    Args:
        request: Optional JSON configuration for the sequential agent

    Returns:
        SequentialFlowRoomResponse: Object containing room details and agent info
    """
    if not PIPECAT_AVAILABLE or SequentialJSONFlowAgent is None:
        raise HTTPException(
            status_code=503, 
            detail="Sequential flow agent features are not available in this deployment"
        )
        
    try:
        room_url, token = await create_room()

        # Start the Sequential JSON flow agent in the background
        background_tasks.add_task(
            run_sequential_flow_agent,
            room_url,
            token,
            request.json_config,
        )

        if settings.debug:
            print(f"[DEBUG] Sequential flow room created: {room_url}")
            if request.json_config:
                print(f"[DEBUG] Using custom config: {request.json_config}")

        # Default values for response (will be updated when agent starts)
        paradigm = "sequential"
        agents_count = 0

        if request.json_config:
            paradigm = request.json_config.get("paradigm", "sequential")
            # Count all agents in the tree
            if "startingAgent" in request.json_config:
                def count_agents(agent):
                    count = 1
                    if "children" in agent:
                        for child in agent["children"]:
                            count += count_agents(child)
                    return count
                agents_count = count_agents(request.json_config["startingAgent"])

        return SequentialFlowRoomResponse(
            room=room_url,
            joinToken=token,
            agentStatus="starting",
            paradigm=paradigm,
            agentsCount=agents_count,
        )

    except Exception as e:
        logger.error(f"Failed to create sequential flow room: {e!s}")
        raise HTTPException(status_code=500, detail="Failed to create sequential flow room")


@router.get("/rooms/{room_url}/status")
async def get_room_status(room_url: str):
    """Get the status of a room and its agent (productivity or JSON flow)."""
    try:
        # Decode the room URL (it might be URL encoded)
        import urllib.parse

        decoded_room_url = urllib.parse.unquote(room_url)

        # Check for productivity agent first
        if decoded_room_url in active_agents:
            agent_info = active_agents[decoded_room_url]
            agent = agent_info["agent"]

            # Get productivity data from the agent
            user_data = agent.get_user_data()

            return {
                "room_url": decoded_room_url,
                "agent_type": "productivity",
                "agent_status": agent_info["status"],
                "features": agent_info["features"],
                "productivity_data": user_data,
                "message": "Productivity assistant is active and ready to help!",
            }

        # Check for JSON flow agent
        if decoded_room_url in active_json_agents:
            agent_info = active_json_agents[decoded_room_url]
            agent = agent_info["agent"]

            # Get flow data from the agent
            flow_data = agent.get_flow_data()

            return {
                "room_url": decoded_room_url,
                "agent_type": "json_flow",
                "agent_status": agent_info["status"],
                "paradigm": agent_info["paradigm"],
                "sub_agents_count": agent_info["sub_agents_count"],
                "configuration": agent_info["configuration"],
                "flow_data": flow_data,
                "message": "JSON flow agent is active and ready to help!",
            }

        # Check for Sequential flow agent
        if decoded_room_url in active_sequential_agents:
            agent_info = active_sequential_agents[decoded_room_url]
            agent = agent_info["agent"]

            # Get flow data from the agent
            flow_data = agent.get_flow_data()

            return {
                "room_url": decoded_room_url,
                "agent_type": "sequential_flow",
                "agent_status": agent_info["status"],
                "paradigm": agent_info["paradigm"],
                "agents_count": agent_info["agents_count"],
                "configuration": agent_info["configuration"],
                "flow_data": flow_data,
                "message": "Sequential JSON flow agent is active and ready to help!",
            }

        return {
            "room_url": decoded_room_url,
            "agent_status": "not_found",
            "message": "No active agent found for this room",
        }

    except Exception as e:
        logger.error(f"Failed to get room status: {e!s}")
        raise HTTPException(status_code=500, detail="Failed to get room status")


@router.delete("/rooms/{room_url}")
async def cleanup_room(room_url: str):
    """Clean up a room and stop its agent (productivity or JSON flow)."""
    try:
        import urllib.parse

        decoded_room_url = urllib.parse.unquote(room_url)

        # Check for productivity agent
        if decoded_room_url in active_agents:
            agent_info = active_agents[decoded_room_url]
            agent = agent_info["agent"]

            # Clean up the agent
            await agent.cleanup()

            # Remove from active agents
            del active_agents[decoded_room_url]

            return {
                "message": f"Productivity room {decoded_room_url} cleaned up successfully",
                "agent_type": "productivity",
                "status": "cleaned_up",
            }

        # Check for JSON flow agent
        if decoded_room_url in active_json_agents:
            agent_info = active_json_agents[decoded_room_url]
            agent = agent_info["agent"]

            # Clean up the agent
            await agent.cleanup()

            # Remove from active agents
            del active_json_agents[decoded_room_url]

            return {
                "message": f"JSON flow room {decoded_room_url} cleaned up successfully",
                "agent_type": "json_flow",
                "status": "cleaned_up",
            }

        # Check for Sequential flow agent
        if decoded_room_url in active_sequential_agents:
            agent_info = active_sequential_agents[decoded_room_url]
            agent = agent_info["agent"]

            # Clean up the agent
            await agent.cleanup()

            # Remove from active agents
            del active_sequential_agents[decoded_room_url]

            return {
                "message": f"Sequential flow room {decoded_room_url} cleaned up successfully",
                "agent_type": "sequential_flow",
                "status": "cleaned_up",
            }

        return {
            "message": f"Room {decoded_room_url} not found or already cleaned up",
            "status": "not_found",
        }

    except Exception as e:
        logger.error(f"Failed to cleanup room: {e!s}")
        raise HTTPException(status_code=500, detail="Failed to cleanup room")
