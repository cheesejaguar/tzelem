"""
JSON Flow Agent using Pipecat Flows - Sequential Paradigm

A dynamic flow-based agent that processes JSON configurations for sequential workflows
with three agent types:
- Data Collector: Collects specific data points from the user
- Router: Routes between different agents based on logic
- Email Agent: Composes and sends emails

This agent uses Pipecat Flows for structured conversations and sequential agent orchestration.
"""

import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / ".env"
print(f"[DEBUG] Loading .env from: {env_path}")
print(f"[DEBUG] .env file exists: {env_path.exists()}")
load_dotenv(env_path)

# Debug: Check if OPENAI_API_KEY is loaded
openai_key = os.getenv("OPENAI_API_KEY")
print(f"[DEBUG] OPENAI_API_KEY loaded: {'Yes' if openai_key else 'No'}")
if openai_key:
    print(f"[DEBUG] OPENAI_API_KEY preview: {openai_key[:10]}...")
else:
    print(
        "[DEBUG] Available env vars starting with OPENAI:",
        [k for k in os.environ if k.startswith("OPENAI")],
    )

import contextlib

from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.services.openai.stt import OpenAISTTService
from pipecat.services.openai.tts import OpenAITTSService
from pipecat.transports.services.daily import DailyParams, DailyTransport
from pipecat_flows import (
    FlowArgs,
    FlowManager,
    FlowResult,
    FlowsFunctionSchema,
    NodeConfig,
)

logger = logging.getLogger(__name__)

# Optional VAD analyzer - fallback to None if not available
try:
    from pipecat.audio.vad.silero import SileroVADAnalyzer

    VAD_AVAILABLE = True
except ImportError as e:
    logger.warning(f"VAD analyzer not available: {e}. Continuing without VAD.")
    SileroVADAnalyzer = None
    VAD_AVAILABLE = False

# Global TTS service
tts = OpenAITTSService(voice="nova")

# Default test JSON configuration
DEFAULT_JSON_CONFIG = {
    "paradigm": "sequential",
    "startingAgent": {
        "type": "router",
        "identifier": "1",
        "prompt": "Welcome! I'll help route your request to the appropriate data collection or email service. What would you like to do today?",
        "children": [
            {
                "type": "dataCollector",
                "identifier": "1_1",
                "prompt": "I need to collect your contact information for our records.",
                "dataPoints": [
                    {"name": "Full Name", "value": ""},
                    {"name": "Email Address", "value": ""},
                    {"name": "Phone Number", "value": ""}
                ],
                "children": [
                    {
                        "type": "router",
                        "identifier": "1_1_1",
                        "prompt": "Great! Now that I have your contact info, would you like me to send you a welcome email or collect additional information?",
                        "children": [
                            {
                                "type": "emailAgent",
                                "identifier": "1_1_1_1",
                                "prompt": "I'll compose and send you a personalized welcome email based on the information you provided."
                            },
                            {
                                "type": "dataCollector",
                                "identifier": "1_1_1_2",
                                "prompt": "Let me collect some additional preferences from you.",
                                "dataPoints": [
                                    {"name": "Preferred Contact Method", "value": ""},
                                    {"name": "Industry", "value": ""}
                                ],
                                "children": [
                                    {
                                        "type": "emailAgent",
                                        "identifier": "1_1_1_2_1",
                                        "prompt": "Perfect! I'll send you a customized follow-up email with relevant information for your industry."
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                "type": "emailAgent",
                "identifier": "1_2",
                "prompt": "I'll send you a quick informational email about our services right away."
            }
        ]
    }
}


# Type definitions for function results
class RouteResult(FlowResult):
    current_agent_id: str | None = None
    routed_to: str | None = None
    status: str | None = None


class DataCollectionResult(FlowResult):
    agent_id: str | None = None
    data_collected: dict[str, str] | None = None
    all_data_collected: bool | None = None
    status: str | None = None


class EmailResult(FlowResult):
    agent_id: str | None = None
    email_content: str | None = None
    status: str | None = None


class SequentialFlowData:
    """Data storage for sequential flow configurations and state."""

    def __init__(self):
        self.current_config: dict[str, Any] = DEFAULT_JSON_CONFIG
        self.flow_tree: dict[str, Any] = {}
        self.paradigm: str = "sequential"
        self.current_agent_id: str = "1"
        self.collected_data: dict[str, dict[str, str]] = {}  # agent_id -> data points
        self.conversation_state = {
            "current_agent_id": "1",
            "flow_active": True
        }


# Global data store
flow_data = SequentialFlowData()


def add_identifiers_to_json(config: dict[str, Any]) -> dict[str, Any]:
    """Add IDENTIFIER properties to all agents in the JSON structure."""
    
    def process_agent(agent: dict[str, Any], identifier: str) -> dict[str, Any]:
        """Recursively process agents and add identifiers."""
        agent_copy = agent.copy()
        agent_copy["identifier"] = identifier
        
        if "children" in agent:
            agent_copy["children"] = []
            for i, child in enumerate(agent["children"], 1):
                child_identifier = f"{identifier}_{i}"
                processed_child = process_agent(child, child_identifier)
                agent_copy["children"].append(processed_child)
                
        return agent_copy
    
    config_copy = config.copy()
    if "startingAgent" in config:
        config_copy["startingAgent"] = process_agent(config["startingAgent"], "1")
    
    return config_copy


def build_agent_lookup(agent: dict[str, Any], lookup: dict[str, dict[str, Any]]) -> None:
    """Build a lookup table for quick agent access by identifier."""
    lookup[agent["identifier"]] = agent
    
    if "children" in agent:
        for child in agent["children"]:
            build_agent_lookup(child, lookup)


# Function schemas
route_to_node_schema = FlowsFunctionSchema(
    name="routeToNode",
    description="Route to a specific agent node by its identifier",
    properties={
        "node_identifier": {
            "type": "string",
            "description": "The IDENTIFIER of the node to route to",
        },
    },
    required=["node_identifier"],
    handler=None,  # Will be set after function definition
)

record_data_schema = FlowsFunctionSchema(
    name="recordData",
    description="Record a piece of data for the current data collection agent",
    properties={
        "data_name": {
            "type": "string",
            "description": "The name of the data point being recorded",
        },
        "data_value": {
            "type": "string",
            "description": "The value of the data point being recorded",
        },
    },
    required=["data_name", "data_value"],
    handler=None,  # Will be set after function definition
)

send_email_schema = FlowsFunctionSchema(
    name="sendEmail",
    description="Compose and send an email, then end the conversation",
    properties={
        "email_subject": {
            "type": "string",
            "description": "Subject line of the email",
        },
        "email_body": {
            "type": "string",
            "description": "Body content of the email",
        },
        "recipient": {
            "type": "string",
            "description": "Email recipient (optional, defaults to user)",
        },
    },
    required=["email_subject", "email_body"],
    handler=None,  # Will be set after function definition
)


# Function handlers
async def route_to_node(
    args: FlowArgs,
    flow_manager: FlowManager,
) -> tuple[RouteResult, NodeConfig]:
    """Route to a specific node by identifier."""
    node_identifier = args["node_identifier"]
    
    # Validate that the node exists
    if node_identifier not in flow_data.flow_tree:
        logger.error(f"Invalid node identifier: {node_identifier}")
        result = RouteResult(
            current_agent_id=flow_data.current_agent_id,
            routed_to=node_identifier,
            status="error"
        )
        return result, None
    
    # Update conversation state
    flow_data.conversation_state["current_agent_id"] = node_identifier
    flow_data.current_agent_id = node_identifier
    
    target_agent = flow_data.flow_tree[node_identifier]
    
    logger.info(f"Routing from {flow_data.current_agent_id} to {node_identifier}")
    logger.info(f"Target agent type: {target_agent.get('type')}")
    
    result = RouteResult(
        current_agent_id=flow_data.current_agent_id,
        routed_to=node_identifier,
        status="success"
    )
    
    # Create appropriate node based on agent type
    if target_agent["type"] == "dataCollector":
        next_node = create_data_collector_node(target_agent)
    elif target_agent["type"] == "router":
        next_node = create_router_node(target_agent)
    elif target_agent["type"] == "emailAgent":
        next_node = create_email_agent_node(target_agent)
    else:
        logger.error(f"Unknown agent type: {target_agent['type']}")
        next_node = create_end_node()
    
    return result, next_node


async def record_data(
    args: FlowArgs,
    flow_manager: FlowManager,
) -> tuple[DataCollectionResult, NodeConfig]:
    """Record data for the current data collection agent."""
    data_name = args["data_name"]
    data_value = args["data_value"]
    current_agent_id = flow_data.current_agent_id
    
    # Initialize data storage for this agent if not exists
    if current_agent_id not in flow_data.collected_data:
        flow_data.collected_data[current_agent_id] = {}
    
    # Record the data
    flow_data.collected_data[current_agent_id][data_name] = data_value
    
    logger.info(f"Recorded data for agent {current_agent_id}: {data_name} = {data_value}")
    
    # Get current agent to check if all data is collected
    current_agent = flow_data.flow_tree[current_agent_id]
    data_points = current_agent.get("dataPoints", [])
    
    collected_data = flow_data.collected_data[current_agent_id]
    all_collected = all(
        point["name"] in collected_data and collected_data[point["name"]]
        for point in data_points
    )
    
    result = DataCollectionResult(
        agent_id=current_agent_id,
        data_collected=collected_data.copy(),
        all_data_collected=all_collected,
        status="success"
    )
    
    # Continue with current node to allow for more data collection or routing
    current_node = create_data_collector_node(current_agent)
    return result, current_node


async def send_email(
    args: FlowArgs,
    flow_manager: FlowManager,
) -> tuple[EmailResult, NodeConfig]:
    """Send an email and end the conversation."""
    email_subject = args["email_subject"]
    email_body = args["email_body"]
    recipient = args.get("recipient", "user@example.com")
    
    current_agent_id = flow_data.current_agent_id
    
    # For testing purposes, just log the email
    logger.info("=" * 50)
    logger.info("EMAIL SENT")
    logger.info("=" * 50)
    logger.info(f"To: {recipient}")
    logger.info(f"Subject: {email_subject}")
    logger.info(f"Body:\n{email_body}")
    logger.info("=" * 50)
    
    result = EmailResult(
        agent_id=current_agent_id,
        email_content=f"Subject: {email_subject}\n\n{email_body}",
        status="sent"
    )
    
    # End the conversation after sending email
    end_node = create_end_node()
    return result, end_node


# Set handlers for function schemas
route_to_node_schema.handler = route_to_node
record_data_schema.handler = record_data
send_email_schema.handler = send_email


# Node configurations
def create_initial_node() -> NodeConfig:
    """Create the initial node that processes JSON configuration."""
    return {
        "name": "initial",
        "role_messages": [
            {
                "role": "system",
                "content": (
                    "You are a Sequential JSON Flow Agent that processes dynamic configurations. "
                    "You will analyze the provided JSON configuration and initialize the sequential flow. "
                    "This is a voice conversation, so avoid special characters and emojis."
                ),
            },
        ],
        "task_messages": [
            {
                "role": "system",
                "content": (
                    f"You are now processing a JSON configuration with paradigm: {flow_data.paradigm}. "
                    "The configuration has been loaded and you will start with the initial agent. "
                    "Announce that you're initializing the sequential flow agent and begin the conversation."
                ),
            },
        ],
        "functions": [],
        "respond_immediately": True,
        "post_actions": [
            {
                "type": "goto_node",
                "node": create_starting_node(),
            },
        ],
    }


def create_starting_node() -> NodeConfig:
    """Create the starting node based on the starting agent."""
    starting_agent = flow_data.flow_tree["1"]
    
    if starting_agent["type"] == "router":
        return create_router_node(starting_agent)
    if starting_agent["type"] == "dataCollector":
        return create_data_collector_node(starting_agent)
    if starting_agent["type"] == "emailAgent":
        return create_email_agent_node(starting_agent)
    return create_end_node()


def create_router_node(agent: dict[str, Any]) -> NodeConfig:
    """Create a router node."""
    agent_id = agent["identifier"]
    prompt = agent.get("prompt", "I will route your request to the appropriate agent.")
    children = agent.get("children", [])
    
    # Build children description for the agent
    children_desc = "\n".join([
        f"- {child['identifier']}: {child['type']} - {child.get('prompt', 'No description')}"
        for child in children
    ])
    
    return {
        "name": f"router_{agent_id}",
        "role_messages": [
            {
                "role": "system",
                "content": (
                    f"You are a Router Agent (ID: {agent_id}) in a sequential flow. "
                    "Your job is to understand the user's request and route them to the appropriate child agent. "
                    "Use the routeToNode function to select which agent to route to based on the user's needs."
                ),
            },
        ],
        "task_messages": [
            {
                "role": "system",
                "content": (
                    f"{prompt}\n\n"
                    f"Available routing options:\n{children_desc}\n\n"
                    "Listen to the user's request and determine which agent would be most appropriate to handle it."
                ),
            },
        ],
        "functions": [route_to_node_schema],
    }


def create_data_collector_node(agent: dict[str, Any]) -> NodeConfig:
    """Create a data collector node."""
    agent_id = agent["identifier"]
    prompt = agent.get("prompt", "I need to collect some information from you.")
    data_points = agent.get("dataPoints", [])
    children = agent.get("children", [])
    
    # Check what data has already been collected
    collected_data = flow_data.collected_data.get(agent_id, {})
    
    # Build data points description
    data_desc = []
    for point in data_points:
        status = "✓ Collected" if point["name"] in collected_data else "○ Needed"
        value = f" ({collected_data[point['name']]})" if point["name"] in collected_data else ""
        data_desc.append(f"- {point['name']}: {status}{value}")
    
    data_points_str = ",".join(data_desc)
    
    # Check if all data is collected
    all_collected = all(
        point["name"] in collected_data and collected_data[point["name"]]
        for point in data_points
    )
    
    functions = [record_data_schema]
    if all_collected and children:
        functions.append(route_to_node_schema)
    
    return {
        "name": f"data_collector_{agent_id}",
        "role_messages": [
            {
                "role": "system",
                "content": (
                    f"You are a Data Collector Agent (ID: {agent_id}) in a sequential flow. "
                    "Your job is to collect specific data points from the user. "
                    "Use the recordData function to store each piece of information. "
                    + ("Once all data is collected, you can use routeToNode to move to the next agent." if children else "")
                ),
            },
        ],
        "task_messages": [
            {
                "role": "system",
                "content": (
                    f"{prompt}\n\n"
                    f"Data points to collect:\n{data_points_str}\n\n"
                    + ("All data collected! You can now route to the next step." if all_collected else "Please collect the missing information.")
                ),
            },
        ],
        "functions": functions,
    }


def create_email_agent_node(agent: dict[str, Any]) -> NodeConfig:
    """Create an email agent node."""
    agent_id = agent["identifier"]
    prompt = agent.get("prompt", "I will compose and send an email for you.")
    
    # Include any collected data in the context
    all_collected_data = {}
    for agent_data in flow_data.collected_data.values():
        all_collected_data.update(agent_data)
    
    data_context = ""
    if all_collected_data:
        data_context = "\n\nCollected data to reference:\n"
        for key, value in all_collected_data.items():
            data_context += f"- {key}: {value}\n"
    
    return {
        "name": f"email_agent_{agent_id}",
        "role_messages": [
            {
                "role": "system",
                "content": (
                    f"You are an Email Agent (ID: {agent_id}) in a sequential flow. "
                    "Your job is to compose and send an email. Use the sendEmail function "
                    "to write and send the email. This will end the conversation."
                ),
            },
        ],
        "task_messages": [
            {
                "role": "system",
                "content": (
                    f"{prompt}{data_context}\n\n"
                    "Compose an appropriate email and send it using the sendEmail function."
                ),
            },
        ],
        "functions": [send_email_schema],
    }


def create_end_node() -> NodeConfig:
    """Create the final end node."""
    return {
        "name": "end",
        "task_messages": [
            {
                "role": "system",
                "content": (
                    "Thank the user for using the Sequential Flow Agent. "
                    "Summarize what was accomplished during this session. "
                    "End the conversation warmly."
                ),
            },
        ],
        "post_actions": [{"type": "end_conversation"}],
    }


class SequentialJSONFlowAgent:
    """Main sequential JSON flow agent class that processes dynamic JSON configurations."""

    def __init__(self, json_config: dict[str, Any] | None = None):
        self.flow_manager: FlowManager | None = None
        self.task: PipelineTask | None = None
        self.load_configuration(json_config or DEFAULT_JSON_CONFIG)

    def load_configuration(self, config: dict[str, Any]) -> None:
        """Load and validate JSON configuration."""
        logger.info(f"Loading Sequential JSON configuration: {json.dumps(config, indent=2)}")

        # Validate required fields
        if "paradigm" not in config:
            msg = "JSON configuration must include 'paradigm' field"
            raise ValueError(msg)

        if config["paradigm"] != "sequential":
            msg = f"Expected paradigm 'sequential', got '{config['paradigm']}'"
            raise ValueError(msg)

        if "startingAgent" not in config:
            msg = "Sequential paradigm requires 'startingAgent' field"
            raise ValueError(msg)

        # Add identifiers to the configuration
        processed_config = add_identifiers_to_json(config)
        
        # Store configuration
        flow_data.current_config = processed_config
        flow_data.paradigm = processed_config["paradigm"]

        # Build agent lookup tree
        flow_data.flow_tree.clear()
        build_agent_lookup(processed_config["startingAgent"], flow_data.flow_tree)
        
        # Reset conversation state
        flow_data.conversation_state = {
            "current_agent_id": "1",
            "flow_active": True
        }
        flow_data.current_agent_id = "1"
        flow_data.collected_data.clear()

        logger.info(f"Configuration validated successfully. Found {len(flow_data.flow_tree)} agents.")

    async def create_flow_pipeline(
        self,
        room_url: str,
        token: str,
        user_id: str | None = None,
    ) -> dict[str, Any]:
        """Create the sequential flow pipeline."""
        try:
            # Configure Daily transport
            daily_params = DailyParams(
                audio_in_enabled=True,
                audio_out_enabled=True,
            )

            # Add VAD analyzer if available
            if VAD_AVAILABLE and SileroVADAnalyzer:
                daily_params.vad_analyzer = SileroVADAnalyzer()
                logger.debug("Using SileroVADAnalyzer for voice activity detection")
            else:
                logger.info("Running without VAD analyzer")

            transport = DailyTransport(
                room_url,
                token,
                "Sequential JSON Flow Agent",
                daily_params,
            )

            # Configure AI services
            llm = OpenAILLMService(
                model="gpt-4o",
            )

            stt = OpenAISTTService()

            # Create context aggregator
            context = OpenAILLMContext()
            context_aggregator = llm.create_context_aggregator(context)

            # Build pipeline
            pipeline_components = [
                transport.input(),
                stt,
                context_aggregator.user(),
                llm,
                tts,
                transport.output(),
                context_aggregator.assistant(),
            ]

            pipeline = Pipeline(pipeline_components)

            # Create pipeline task
            self.task = PipelineTask(
                pipeline,
                params=PipelineParams(allow_interruptions=True),
            )

            # Initialize flow manager
            self.flow_manager = FlowManager(
                task=self.task,
                llm=llm,
                context_aggregator=context_aggregator,
            )

            # Set up transport event handler
            @transport.event_handler("on_first_participant_joined")
            async def on_first_participant_joined(transport, participant):
                await transport.capture_participant_transcription(participant["id"])
                logger.debug("Initializing Sequential JSON flow")
                await self.flow_manager.initialize(create_starting_node())

            return {
                "room_url": room_url,
                "status": "ready",
                "transport": transport,
                "flow_manager": self.flow_manager,
                "task": self.task,
                "configuration": flow_data.current_config,
                "paradigm": flow_data.paradigm,
                "agents_count": len(flow_data.flow_tree),
            }

        except Exception as e:
            logger.error(f"Failed to create sequential flow pipeline: {e}")
            raise

    async def run_flow(self) -> None:
        """Run the sequential flow."""
        if not self.task:
            msg = "Task not initialized. Call create_flow_pipeline first."
            raise RuntimeError(msg)

        runner = PipelineRunner()
        await runner.run(self.task)

    def get_flow_data(self) -> dict[str, Any]:
        """Get current flow configuration and state."""
        return {
            "configuration": flow_data.current_config,
            "paradigm": flow_data.paradigm,
            "flow_tree": flow_data.flow_tree,
            "current_agent_id": flow_data.current_agent_id,
            "collected_data": flow_data.collected_data,
            "conversation_state": flow_data.conversation_state,
            "agents_count": len(flow_data.flow_tree),
        }

    async def cleanup(self) -> None:
        """Clean up flow resources."""
        if self.task and not self.task.done():
            self.task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self.task

        # Reset configuration data
        flow_data.current_config = DEFAULT_JSON_CONFIG
        flow_data.flow_tree.clear()
        flow_data.collected_data.clear()
        flow_data.paradigm = "sequential"
        flow_data.current_agent_id = "1"
        flow_data.conversation_state = {"current_agent_id": "1", "flow_active": True}


# Global instance
sequential_json_flow_agent = SequentialJSONFlowAgent()
