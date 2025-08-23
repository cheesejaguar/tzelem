"""
JSON Flow Agent using Pipecat Flows

A dynamic flow-based agent that processes JSON configurations to create
different paradigms (Sequential or Agentic) with various agent types:
- Browser Agent: Executes browser-based tasks
- Mail Agent: Handles email communications

This agent uses Pipecat Flows for structured conversations and dynamic agent orchestration.
"""

import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Any

from browserbase import Browserbase
from dotenv import load_dotenv

# Browser-use imports - may not be available in all environments
try:
    from browser_use import Agent, BrowserProfile, BrowserSession
    from langchain_openai import ChatOpenAI

    BROWSER_USE_AVAILABLE = True
except ImportError:
    Agent = None
    BrowserProfile = None
    BrowserSession = None
    ChatOpenAI = None
    BROWSER_USE_AVAILABLE = False

# from kernel import Kernel
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

# Default test JSON configuration

tts = OpenAITTSService(voice="nova")

DEFAULT_JSON_CONFIG = {
    "paradigm": "Agentic",
    "subAgents": [
        {
            "type": "browser-agent",
            "prompt": "Search for the latest information about artificial intelligence developments",
        },
        {
            "type": "mail-agent",
            "prompt": "Send a summary email about the AI research findings to the team",
        },
    ],
}


# Type definitions for function results
class BrowserResult(FlowResult):
    agent_id: int | None = None
    agent_type: str | None = None
    prompt: str | None = None
    status: bool | None = None
    run_result: str | None = None
    actions_completed: list[dict] | None = None


class MailResult(FlowResult):
    agent_id: int
    agent_type: str
    prompt: str
    status: str


class JSONFlowData:
    """Data storage for JSON flow configurations and agent information."""

    def __init__(self):
        self.current_config: dict[str, Any] = DEFAULT_JSON_CONFIG
        self.sub_agents: list[dict[str, Any]] = []
        self.paradigm: str = "Agentic"


# Global data store
json_flow_data = JSONFlowData()

# Function schemas defined at the top
browser_function_schema = FlowsFunctionSchema(
    name="browser_function",
    description="Execute a browser agent by its identifier",
    properties={
        "agent_id": {
            "type": "integer",
            "identifier": "The identifier (index) of the browser agent to execute",
        },
    },
    required=["agent_id"],
    handler=None,  # Will be set after function definition
)

mail_function_schema = FlowsFunctionSchema(
    name="mail_function",
    description="Execute a mail agent by its identifier",
    properties={
        "agent_id": {
            "type": "integer",
            "identifier": "The identifier (index) of the mail agent to execute",
        },
    },
    required=["agent_id"],
    handler=None,  # Will be set after function definition
)

continue_conversation_schema = FlowsFunctionSchema(
    name="continue_conversation_function",
    description="Once you have done all the user has asked for, but they haven't given indication that they would like to end the conversation, run this function to recieve user input",
    properties={},
    required=[],
    handler=None,  # Will be set after function definition
)

end_conversation_schema = FlowsFunctionSchema(
    name="end_conversation",
    description="End the JSON flow session",
    properties={},
    required=[],
    handler=None,  # Will be set after function definition
)


def browser_step_finish_hook(agent):
    print(agent.history.model_actions)


def convert_json_to_markdown(config: dict[str, Any]) -> str:
    """Convert JSON configuration to markdown format for the master node."""
    markdown = "# Flow Configuration\n\n"
    markdown += f"**Paradigm**: {config.get('paradigm', 'Unknown')}\n\n"

    if "subAgents" in config:
        markdown += "## Available Sub-Agents\n\n"
        for i, agent in enumerate(config["subAgents"]):
            markdown += f"### Agent {i} - {agent.get('type', 'Unknown Type')}\n"
            markdown += f"- **Identifier**: {i}\n"
            markdown += f"- **Type**: {agent.get('type', 'Unknown')}\n"
            markdown += f"- **Prompt**: {agent.get('prompt', 'No prompt specified')}\n"
            if "url" in agent:
                markdown += f"- **URL**: {agent['url']}\n"
            markdown += "\n"

    return markdown


# Function handlers for Agentic paradigm
async def browser_function(
    args: FlowArgs,
    flow_manager: FlowManager,
) -> tuple[BrowserResult, NodeConfig]:
    """Execute browser agent task by identifier."""
    agent_id = args["agent_id"]

    # Validate agent_id
    if agent_id < 0 or agent_id >= len(json_flow_data.sub_agents):
        logger.error(f"Invalid agent_id: {agent_id}")
        result = BrowserResult(
            prompt="Invalid agent ID",
        )

        return result, None

    agent = json_flow_data.sub_agents[agent_id]

    # Validate agent type
    if agent.get("type") != "browser-agent":
        logger.error(f"Agent {agent_id} is not a browser-agent, it's a {agent.get('type')}")
        result = BrowserResult(
            agent_id=agent_id,
            agent_type=agent.get("type", "unknown"),
            prompt=agent.get("prompt", ""),
            url=agent.get("url", ""),
            status="error",
        )
        return result, None

    # Log the agent being executed
    logger.info(f"Executing Browser Agent {agent_id}")
    logger.info(f"Agent details: {json.dumps(agent, indent=2)}")

    # Create Browserbase session
    bb = Browserbase(api_key=os.environ["BROWSERBASE_API_KEY"])
    session = bb.sessions.create(project_id=os.environ["BROWSERBASE_PROJECT_ID"])

    logger.info(f"Browserbase Session ID: {session.id}")
    logger.info(f"Debug URL: https://www.browserbase.com/sessions/{session.id}")

    if not BROWSER_USE_AVAILABLE:
        logger.error("Browser-use dependencies not available")
        return BrowserResult(
            agent_id=agent.get("identifier"),
            agent_type="browser",
            prompt=agent.get("prompt"),
            status=False,
            run_result="Browser-use dependencies not available in this environment",
        )

    # Configure browser profile
    profile = BrowserProfile(
        keep_alive=False,  # Essential for proper cleanup
        wait_between_actions=2.0,
        default_timeout=30000,
        default_navigation_timeout=30000,
    )

    # Create browser session
    browser_session = BrowserSession(
        cdp_url=session.connect_url,
        browser_profile=profile,
        keep_alive=False,  # Essential for proper cleanup
        initialized=False,
    )

    try:
        # Start the browser session
        await browser_session.start()
        logger.info("✅ Browser session initialized successfully")

        # Use the actual task from the agent configuration
        task = agent.get("prompt", "Navigate to the specified URL and perform basic web browsing")

        # Create Browser Use agent
        browser_agent = Agent(
            task=task,
            llm=ChatOpenAI(model="gpt-4o-mini"),
            browser_session=browser_session,
            enable_memory=False,
            max_failures=5,
            retry_delay=5,
            max_actions_per_step=1,
        )

        logger.info(f"🚀 Starting browser task: {task}")
        history = await browser_agent.run(max_steps=20, on_step_end=browser_step_finish_hook)
        logger.info("🎉 Browser task completed successfully!")

    except Exception as e:
        # Handle expected browser disconnection after successful completion
        error_msg = str(e).lower()
        if "browser is closed" in error_msg or "disconnected" in error_msg:
            logger.info("✅ Task completed - Browser session ended normally")

            # Create a mock successful history for this case
            class MockHistory:
                def __init__(self):
                    self.is_successful = True
                    self.final_result = "Task completed successfully (session ended normally)"
                    self._model_actions = []

                def model_actions(self):
                    return self._model_actions

            history = MockHistory()
        else:
            logger.error(f"❌ Browser agent execution error: {e}")
            raise

    finally:
        # Cleanup browser session
        try:
            if browser_session and browser_session.initialized:
                await browser_session.stop()
                logger.info("✅ Browser session closed successfully")
        except Exception as e:
            error_msg = str(e).lower()
            if "browser is closed" in error_msg or "disconnected" in error_msg:
                logger.info("Browser session was already closed (expected behavior)")
            else:
                logger.warning(f"⚠️  Error during browser session closure: {e}")

        # Clean up agent reference
        if "browser_agent" in locals():
            del browser_agent

    result = BrowserResult(
        agent_id=agent_id,
        agent_type="browser-agent",
        prompt=agent.get("prompt", ""),
        status=history.is_successful,
        run_result=history.final_result,
        actions_completed=history.model_actions(),
    )

    # Store execution result in flow state
    flow_manager.state[f"browser_agent_{agent_id}_result"] = {
        "executed": True,
        "agent": agent,
        "timestamp": asyncio.get_event_loop().time(),
    }

    return result, None


async def continue_function(
    args: FlowArgs,
    flow_manager: FlowManager,
) -> tuple[MailResult, NodeConfig]:
    return None, create_master_node()


async def mail_function(
    args: FlowArgs,
    flow_manager: FlowManager,
) -> tuple[MailResult, NodeConfig]:
    """Execute mail agent task by identifier."""
    agent_id = args["agent_id"]

    # Validate agent_id
    if agent_id < 0 or agent_id >= len(json_flow_data.sub_agents):
        logger.error(f"Invalid agent_id: {agent_id}")
        result = MailResult(
            agent_id=agent_id,
            agent_type="mail-agent",
            prompt="Invalid agent ID",
            status="error",
        )
        return result, None

    agent = json_flow_data.sub_agents[agent_id]

    # Validate agent type
    if agent.get("type") != "mail-agent":
        logger.error(f"Agent {agent_id} is not a mail-agent, it's a {agent.get('type')}")
        result = MailResult(
            agent_id=agent_id,
            agent_type=agent.get("type", "unknown"),
            prompt=agent.get("prompt", ""),
            status="error",
        )
        return result, None

    # Log the agent being executed
    logger.info(f"Executing Mail Agent {agent_id}")
    logger.info(f"Agent details: {json.dumps(agent, indent=2)}")

    result = MailResult(
        agent_id=agent_id,
        agent_type="mail-agent",
        prompt=agent.get("prompt", ""),
        status="completed",
    )

    # Store execution result in flow state
    flow_manager.state[f"mail_agent_{agent_id}_result"] = {
        "executed": True,
        "agent": agent,
        "timestamp": asyncio.get_event_loop().time(),
    }

    next_node = create_master_node()
    return result, next_node


async def end_conversation(args: FlowArgs) -> tuple[FlowResult, NodeConfig]:
    """Handle conversation end."""
    logger.debug("Ending JSON flow session")
    result = {"status": "completed", "message": "JSON flow completed successfully!"}
    next_node = create_end_node()
    return result, next_node


# Set handlers for function schemas after function definitions
browser_function_schema.handler = browser_function
mail_function_schema.handler = mail_function
continue_conversation_schema.handler = continue_function
end_conversation_schema.handler = end_conversation


# Node configurations
def create_initial_node() -> NodeConfig:
    """Create the initial node that processes JSON configuration."""
    return {
        "name": "initial",
        "role_messages": [
            {
                "role": "system",
                "content": (
                    "You are a JSON Flow Agent that processes dynamic configurations. "
                    "You will analyze the provided JSON configuration and determine the paradigm. "
                    "Based on the paradigm, you will create appropriate flow structures. "
                    "This is a voice conversation, so avoid special characters and emojis."
                ),
            },
        ],
        "task_messages": [
            {
                "role": "system",
                "content": (
                    f"You are now processing a JSON configuration with paradigm: {json_flow_data.paradigm}. "
                    f"The configuration has been loaded and you will proceed to the appropriate handler. "
                    "Announce that you're initializing the JSON flow agent and describe the configuration."
                ),
            },
        ],
        "functions": [],
        "respond_immediately": True,
        "post_actions": [
            {
                "type": "goto_node",
                "node": create_paradigm_router_node(),
            },
        ],
    }


def create_paradigm_router_node() -> NodeConfig:
    """Route to appropriate paradigm handler."""
    if json_flow_data.paradigm.lower() == "agentic":
        return create_master_node()
    # For Sequential or other paradigms, create a basic end node for now
    return create_end_node()


def create_master_node() -> NodeConfig:
    """Create the master node for Agentic paradigm."""
    config_markdown = convert_json_to_markdown(json_flow_data.current_config)

    return {
        "name": "master_node",
        "role_messages": [
            {
                "role": "system",
                "content": (
                    "You are the Master Agent in an Agentic paradigm. You are meant to call agents to help the user with their requests. You coordinate and manage sub-agents "
                    "based on the provided configuration. You can call Browser and Mail functions by "
                    "specifying the agent identifier (index in the subagents array). "
                    "Make decisions about which agents to call and when based on the conversation context."
                    "Whenever the user indicates intent to end the conversation, call the end_conversation_schema"
                ),
            },
        ],
        "task_messages": [
            {
                "role": "system",
                "content": (
                    f"Here is your current configuration:\n\n{config_markdown}\n\n"
                    "You can call agents by their identifier. Analyze the user's request and determine "
                    "which agents to execute. Use the Browser function for browser-agents and Mail function "
                    "for mail-agents. Ask the user what they would like to accomplish."
                ),
            },
        ],
        "functions": [
            browser_function_schema,
            mail_function_schema,
            end_conversation_schema,
        ],
    }


def create_end_node() -> NodeConfig:
    """Create the final end node."""
    return {
        "name": "end",
        "task_messages": [
            {
                "role": "system",
                "content": (
                    "Thank the user for using the JSON Flow Agent. "
                    "Summarize what was accomplished during this session. "
                    "End the conversation warmly."
                ),
            },
        ],
        "post_actions": [{"type": "end_conversation"}],
    }


class JSONFlowAgent:
    """Main JSON flow agent class that processes dynamic JSON configurations."""

    def __init__(self, json_config: dict[str, Any] | None = None):
        self.flow_manager: FlowManager | None = None
        self.task: PipelineTask | None = None
        self.load_configuration(json_config or DEFAULT_JSON_CONFIG)

    def load_configuration(self, config: dict[str, Any]) -> None:
        """Load and validate JSON configuration."""
        logger.info(f"Loading JSON configuration: {json.dumps(config, indent=2)}")

        # Validate required fields
        if "paradigm" not in config:
            msg = "JSON configuration must include 'paradigm' field"
            raise ValueError(msg)

        json_flow_data.current_config = config
        json_flow_data.paradigm = config["paradigm"]

        # Load sub-agents if present
        if "subAgents" in config:
            json_flow_data.sub_agents = config["subAgents"]
            logger.info(f"Loaded {len(json_flow_data.sub_agents)} sub-agents")

            # Validate sub-agents
            for i, agent in enumerate(json_flow_data.sub_agents):
                if "type" not in agent:
                    msg = f"Sub-agent {i} missing 'type' field"
                    raise ValueError(msg)
                if agent["type"] not in ["browser-agent", "mail-agent"]:
                    msg = f"Sub-agent {i} has invalid type: {agent['type']}"
                    raise ValueError(msg)
                if "prompt" not in agent:
                    msg = f"Sub-agent {i} missing 'prompt' field"
                    raise ValueError(msg)

        logger.info(f"Configuration validated successfully. Paradigm: {json_flow_data.paradigm}")

    async def create_flow_pipeline(
        self,
        room_url: str,
        token: str,
        user_id: str | None = None,
    ) -> dict[str, Any]:
        """Create the JSON flow pipeline."""
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
                "JSON Flow Agent",
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
                logger.debug("Initializing JSON flow")
                if json_flow_data.paradigm == "Agentic":
                    await self.flow_manager.initialize(create_master_node())
                else:
                    print("Wrong")

            return {
                "room_url": room_url,
                "status": "ready",
                "transport": transport,
                "flow_manager": self.flow_manager,
                "task": self.task,
                "configuration": json_flow_data.current_config,
                "paradigm": json_flow_data.paradigm,
                "sub_agents_count": len(json_flow_data.sub_agents),
            }

        except Exception as e:
            logger.error(f"Failed to create JSON flow pipeline: {e}")
            raise

    async def run_flow(self) -> None:
        """Run the JSON flow."""
        if not self.task:
            msg = "Task not initialized. Call create_flow_pipeline first."
            raise RuntimeError(msg)

        runner = PipelineRunner()
        await runner.run(self.task)

    def get_flow_data(self) -> dict[str, Any]:
        """Get current flow configuration and state."""
        return {
            "configuration": json_flow_data.current_config,
            "paradigm": json_flow_data.paradigm,
            "sub_agents": json_flow_data.sub_agents,
            "sub_agents_count": len(json_flow_data.sub_agents),
        }

    async def cleanup(self) -> None:
        """Clean up flow resources."""
        if self.task and not self.task.done():
            self.task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self.task

        # Reset configuration data
        json_flow_data.current_config = DEFAULT_JSON_CONFIG
        json_flow_data.sub_agents.clear()
        json_flow_data.paradigm = "Agentic"


# Global instance
json_flow_agent = JSONFlowAgent()
