"""
Productivity Assistant Agent using Pipecat Flows

A dynamic flow-based productivity agent that helps users with:
- Task management and tracking
- Schedule planning and time blocking
- Goal setting and progress monitoring
- Productivity coaching and motivation

This agent uses Pipecat Flows for structured conversations and state management.
"""

import asyncio
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

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
    print("[DEBUG] Available env vars starting with OPENAI:", [k for k in os.environ.keys() if k.startswith("OPENAI")])

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


# Type definitions for function results
class TaskCreationResult(FlowResult):
    task_id: str
    title: str
    description: str
    priority: str
    due_date: str | None


class ScheduleResult(FlowResult):
    event_id: str
    title: str
    start_time: str
    duration: int
    event_type: str


class GoalResult(FlowResult):
    goal_id: str
    name: str
    description: str
    target: int
    unit: str
    deadline: str | None


class CoachingResult(FlowResult):
    advice_type: str
    message: str
    actionable_tips: list[str]


# Mock data storage (in production, use proper database)
class ProductivityData:
    def __init__(self):
        self.tasks: dict[str, dict] = {}
        self.schedule: dict[str, dict] = {}
        self.goals: dict[str, dict] = {}
        self.user_context: dict[str, Any] = {}


# Global data store
productivity_data = ProductivityData()


# Function handlers
async def collect_task_info(
    args: FlowArgs, flow_manager: FlowManager,
) -> tuple[TaskCreationResult, NodeConfig]:
    """Process task creation."""
    title = args["title"]
    description = args.get("description", "")
    priority = args.get("priority", "medium")
    due_date = args.get("due_date")

    logger.debug(f"Creating task: {title} with priority: {priority}")

    task_id = str(uuid4())
    task_data = {
        "id": task_id,
        "title": title,
        "description": description,
        "priority": priority,
        "due_date": due_date,
        "status": "pending",
        "created_at": datetime.now().isoformat(),
    }

    productivity_data.tasks[task_id] = task_data
    flow_manager.state["last_task"] = task_data

    result = TaskCreationResult(
        task_id=task_id,
        title=title,
        description=description,
        priority=priority,
        due_date=due_date,
    )

    next_node = create_task_success_node(result)
    return result, next_node


async def schedule_time_block(
    args: FlowArgs, flow_manager: FlowManager,
) -> tuple[ScheduleResult, NodeConfig]:
    """Process schedule time blocking."""
    title = args["title"]
    start_time = args["start_time"]
    duration = args.get("duration", 60)  # Default 1 hour
    event_type = args.get("type", "work")

    logger.debug(f"Scheduling: {title} at {start_time} for {duration} minutes")

    event_id = str(uuid4())
    event_data = {
        "id": event_id,
        "title": title,
        "start_time": start_time,
        "duration": duration,
        "type": event_type,
        "created_at": datetime.now().isoformat(),
    }

    productivity_data.schedule[event_id] = event_data
    flow_manager.state["last_event"] = event_data

    result = ScheduleResult(
        event_id=event_id,
        title=title,
        start_time=start_time,
        duration=duration,
        event_type=event_type,
    )

    next_node = create_schedule_success_node(result)
    return result, next_node


async def create_goal(
    args: FlowArgs, flow_manager: FlowManager,
) -> tuple[GoalResult, NodeConfig]:
    """Process goal creation."""
    name = args["name"]
    description = args.get("description", "")
    target = args["target"]
    unit = args.get("unit", "tasks")
    deadline = args.get("deadline")

    logger.debug(f"Creating goal: {name} with target: {target} {unit}")

    goal_id = str(uuid4())
    goal_data = {
        "id": goal_id,
        "name": name,
        "description": description,
        "target": target,
        "unit": unit,
        "deadline": deadline,
        "current_progress": 0,
        "created_at": datetime.now().isoformat(),
    }

    productivity_data.goals[goal_id] = goal_data
    flow_manager.state["last_goal"] = goal_data

    result = GoalResult(
        goal_id=goal_id,
        name=name,
        description=description,
        target=target,
        unit=unit,
        deadline=deadline,
    )

    next_node = create_goal_success_node(result)
    return result, next_node


async def provide_coaching(
    args: FlowArgs, flow_manager: FlowManager,
) -> tuple[CoachingResult, NodeConfig]:
    """Provide productivity coaching advice."""
    coaching_type = args.get("type", "general")
    # context = args.get("context", "")  # Reserved for future use

    logger.debug(f"Providing coaching for: {coaching_type}")

    # Simple coaching logic (in production, use LLM for personalized advice)
    advice_map = {
        "time_management": {
            "message": "Great question about time management! Here's what I recommend:",
            "tips": [
                "Use the Pomodoro Technique - 25 minutes focused work, 5 minute breaks",
                "Time block your calendar for deep work sessions",
                "Batch similar tasks together to reduce context switching",
                "Set clear boundaries and learn to say no to non-essential requests",
            ],
        },
        "focus": {
            "message": "Staying focused can be challenging. Let me share some proven strategies:",
            "tips": [
                "Eliminate distractions - turn off notifications during focus time",
                "Use the two-minute rule - if it takes less than 2 minutes, do it now",
                "Create a dedicated workspace that signals 'work mode' to your brain",
                "Practice mindfulness to improve your attention span",
            ],
        },
        "motivation": {
            "message": "Let's work on boosting your motivation and momentum:",
            "tips": [
                "Break large goals into smaller, achievable milestones",
                "Celebrate small wins to maintain positive momentum",
                "Find an accountability partner or join a productivity group",
                "Connect your tasks to your bigger purpose and values",
            ],
        },
    }

    advice = advice_map.get(coaching_type, advice_map["time_management"])

    result = CoachingResult(
        advice_type=coaching_type,
        message=advice["message"],
        actionable_tips=advice["tips"],
    )

    next_node = create_coaching_response_node(result)
    return result, next_node


async def continue_conversation(args: FlowArgs) -> tuple[FlowResult, NodeConfig]:
    """Continue the conversation or help with something else."""
    next_action = args.get("action", "ask_how_to_help")

    if next_action == "task":
        next_node = create_task_management_node()
    elif next_action == "schedule":
        next_node = create_schedule_node()
    elif next_action == "goal":
        next_node = create_goal_setting_node()
    elif next_action == "coaching":
        next_node = create_coaching_node()
    else:
        next_node = create_main_menu_node()

    return {"status": "continuing"}, next_node


async def end_conversation(args: FlowArgs) -> tuple[FlowResult, NodeConfig]:
    """Handle conversation end."""
    logger.debug("Ending productivity session")
    result = {"status": "completed", "message": "Have a productive day!"}
    next_node = create_end_node()
    return result, next_node


# Node configurations
def create_initial_node() -> NodeConfig:
    """Create the initial welcome node."""
    return {
        "name": "initial",
        "role_messages": [
            {
                "role": "system",
                "content": (
                    "You are a friendly and knowledgeable productivity assistant. "
                    "Your goal is to help users manage their tasks, plan their schedules, "
                    "set meaningful goals, and improve their productivity habits. "
                    "Be conversational, encouraging, and actionable in your responses. "
                    "This is a voice conversation, so avoid special characters and emojis."
                ),
            },
        ],
        "task_messages": [
            {
                "role": "system",
                "content": (
                    "Welcome the user warmly and briefly explain how you can help with "
                    "productivity. Ask what they'd like to work on today. Keep it concise "
                    "and natural for voice conversation."
                ),
            },
        ],
        "functions": [
            {
                "type": "function",
                "function": {
                    "name": "continue_conversation",
                    "handler": continue_conversation,
                    "description": "Direct conversation to specific productivity area",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "action": {
                                "type": "string",
                                "enum": ["task", "schedule", "goal", "coaching", "ask_how_to_help"],
                            },
                        },
                        "required": ["action"],
                    },
                },
            },
        ],
        "respond_immediately": True,
    }


def create_main_menu_node() -> NodeConfig:
    """Create node for main menu options."""
    return {
        "name": "main_menu",
        "task_messages": [
            {
                "role": "system",
                "content": (
                    "Ask the user what they'd like to work on. You can help with: "
                    "task management, schedule planning, goal setting, or productivity coaching. "
                    "Listen for their preference and use the continue_conversation function."
                ),
            },
        ],
        "functions": [
            {
                "type": "function",
                "function": {
                    "name": "continue_conversation",
                    "handler": continue_conversation,
                    "description": "Navigate to requested productivity area",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "action": {
                                "type": "string",
                                "enum": ["task", "schedule", "goal", "coaching"],
                            },
                        },
                        "required": ["action"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "end_conversation",
                    "handler": end_conversation,
                    "description": "End the productivity session",
                    "parameters": {"type": "object", "properties": {}},
                },
            },
        ],
    }


def create_task_management_node() -> NodeConfig:
    """Create node for task management."""
    return {
        "name": "task_management",
        "task_messages": [
            {
                "role": "system",
                "content": (
                    "Help the user create a new task. Ask for the task title and any "
                    "additional details like description, priority level, and due date. "
                    "Use the collect_task_info function when you have enough information."
                ),
            },
        ],
        "pre_actions": [
            {
                "type": "tts_say",
                "text": "Let me help you create a new task.",
            },
        ],
        "functions": [
            {
                "type": "function",
                "function": {
                    "name": "collect_task_info",
                    "handler": collect_task_info,
                    "description": "Create a new task with provided details",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "description": {"type": "string"},
                            "priority": {"type": "string", "enum": ["low", "medium", "high"]},
                            "due_date": {"type": "string"},
                        },
                        "required": ["title"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "continue_conversation",
                    "handler": continue_conversation,
                    "description": "Go back to main menu",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "action": {"type": "string", "enum": ["ask_how_to_help"]},
                        },
                        "required": ["action"],
                    },
                },
            },
        ],
    }


def create_schedule_node() -> NodeConfig:
    """Create node for schedule planning."""
    return {
        "name": "schedule_planning",
        "task_messages": [
            {
                "role": "system",
                "content": (
                    "Help the user schedule time blocks for productive work. "
                    "Ask for what they want to work on, when they want to schedule it, "
                    "and how long they need. Use schedule_time_block when ready."
                ),
            },
        ],
        "pre_actions": [
            {
                "type": "tts_say",
                "text": "Great! Let's schedule some focused work time.",
            },
        ],
        "functions": [
            {
                "type": "function",
                "function": {
                    "name": "schedule_time_block",
                    "handler": schedule_time_block,
                    "description": "Schedule a time block for focused work",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "title": {"type": "string"},
                            "start_time": {"type": "string"},
                            "duration": {"type": "integer"},
                            "type": {"type": "string", "enum": ["work", "meeting", "break", "personal"]},
                        },
                        "required": ["title", "start_time"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "continue_conversation",
                    "handler": continue_conversation,
                    "description": "Return to main menu",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "action": {"type": "string", "enum": ["ask_how_to_help"]},
                        },
                        "required": ["action"],
                    },
                },
            },
        ],
    }


def create_goal_setting_node() -> NodeConfig:
    """Create node for goal setting."""
    return {
        "name": "goal_setting",
        "task_messages": [
            {
                "role": "system",
                "content": (
                    "Help the user set a meaningful goal. Ask for the goal name, "
                    "what they want to achieve (target number), what unit to measure "
                    "(tasks, hours, etc.), and any deadline. Use create_goal when ready."
                ),
            },
        ],
        "pre_actions": [
            {
                "type": "tts_say",
                "text": "Excellent! Let's set up a goal to work towards.",
            },
        ],
        "functions": [
            {
                "type": "function",
                "function": {
                    "name": "create_goal",
                    "handler": create_goal,
                    "description": "Create a new productivity goal",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "description": {"type": "string"},
                            "target": {"type": "integer"},
                            "unit": {"type": "string"},
                            "deadline": {"type": "string"},
                        },
                        "required": ["name", "target"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "continue_conversation",
                    "handler": continue_conversation,
                    "description": "Go back to main menu",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "action": {"type": "string", "enum": ["ask_how_to_help"]},
                        },
                        "required": ["action"],
                    },
                },
            },
        ],
    }


def create_coaching_node() -> NodeConfig:
    """Create node for productivity coaching."""
    return {
        "name": "productivity_coaching",
        "task_messages": [
            {
                "role": "system",
                "content": (
                    "Provide productivity coaching advice. Ask what specific area they need "
                    "help with: time management, focus, or motivation. Use provide_coaching "
                    "to give targeted advice."
                ),
            },
        ],
        "pre_actions": [
            {
                "type": "tts_say",
                "text": "I'd love to help you boost your productivity!",
            },
        ],
        "functions": [
            {
                "type": "function",
                "function": {
                    "name": "provide_coaching",
                    "handler": provide_coaching,
                    "description": "Provide productivity coaching advice",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "type": {"type": "string", "enum": ["time_management", "focus", "motivation"]},
                            "context": {"type": "string"},
                        },
                        "required": ["type"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "continue_conversation",
                    "handler": continue_conversation,
                    "description": "Return to main menu",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "action": {"type": "string", "enum": ["ask_how_to_help"]},
                        },
                        "required": ["action"],
                    },
                },
            },
        ],
    }


# Success/Response nodes
def create_task_success_node(task_result: TaskCreationResult) -> NodeConfig:
    """Create success node for task creation."""
    return {
        "name": "task_success",
        "task_messages": [
            {
                "role": "system",
                "content": (
                    f"Confirm that the task '{task_result['title']}' has been created "
                    f"with {task_result['priority']} priority. Ask if they need anything else "
                    "or want to create another task."
                ),
            },
        ],
        "functions": [
            {
                "type": "function",
                "function": {
                    "name": "continue_conversation",
                    "handler": continue_conversation,
                    "description": "Continue with another action or return to menu",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "action": {
                                "type": "string",
                                "enum": ["task", "schedule", "goal", "coaching", "ask_how_to_help"],
                            },
                        },
                        "required": ["action"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "end_conversation",
                    "handler": end_conversation,
                    "description": "End the session",
                    "parameters": {"type": "object", "properties": {}},
                },
            },
        ],
    }


def create_schedule_success_node(schedule_result: ScheduleResult) -> NodeConfig:
    """Create success node for schedule creation."""
    return {
        "name": "schedule_success",
        "task_messages": [
            {
                "role": "system",
                "content": (
                    f"Confirm that '{schedule_result['title']}' has been scheduled "
                    f"at {schedule_result['start_time']} for {schedule_result['duration']} minutes. "
                    "Ask if they want to schedule anything else."
                ),
            },
        ],
        "functions": [
            {
                "type": "function",
                "function": {
                    "name": "continue_conversation",
                    "handler": continue_conversation,
                    "description": "Continue with another action",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "action": {
                                "type": "string",
                                "enum": ["task", "schedule", "goal", "coaching", "ask_how_to_help"],
                            },
                        },
                        "required": ["action"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "end_conversation",
                    "handler": end_conversation,
                    "description": "End the session",
                    "parameters": {"type": "object", "properties": {}},
                },
            },
        ],
    }


def create_goal_success_node(goal_result: GoalResult) -> NodeConfig:
    """Create success node for goal creation."""
    return {
        "name": "goal_success",
        "task_messages": [
            {
                "role": "system",
                "content": (
                    f"Great! Your goal '{goal_result['name']}' has been set with a target "
                    f"of {goal_result['target']} {goal_result['unit']}. Ask if they want "
                    "to set another goal or need help with something else."
                ),
            },
        ],
        "functions": [
            {
                "type": "function",
                "function": {
                    "name": "continue_conversation",
                    "handler": continue_conversation,
                    "description": "Continue with another action",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "action": {
                                "type": "string",
                                "enum": ["task", "schedule", "goal", "coaching", "ask_how_to_help"],
                            },
                        },
                        "required": ["action"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "end_conversation",
                    "handler": end_conversation,
                    "description": "End the session",
                    "parameters": {"type": "object", "properties": {}},
                },
            },
        ],
    }


def create_coaching_response_node(coaching_result: CoachingResult) -> NodeConfig:
    """Create response node for coaching advice."""
    tips_text = " ".join([f"Tip {i+1}: {tip}" for i, tip in enumerate(coaching_result["actionable_tips"])])

    return {
        "name": "coaching_response",
        "task_messages": [
            {
                "role": "system",
                "content": (
                    f"{coaching_result['message']} Here are some actionable tips: {tips_text} "
                    "Ask if they have questions about any of these tips or want advice "
                    "on a different productivity topic."
                ),
            },
        ],
        "functions": [
            {
                "type": "function",
                "function": {
                    "name": "provide_coaching",
                    "handler": provide_coaching,
                    "description": "Provide more coaching advice",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "type": {"type": "string", "enum": ["time_management", "focus", "motivation"]},
                            "context": {"type": "string"},
                        },
                        "required": ["type"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "continue_conversation",
                    "handler": continue_conversation,
                    "description": "Continue with different productivity area",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "action": {
                                "type": "string",
                                "enum": ["task", "schedule", "goal", "ask_how_to_help"],
                            },
                        },
                        "required": ["action"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "end_conversation",
                    "handler": end_conversation,
                    "description": "End the session",
                    "parameters": {"type": "object", "properties": {}},
                },
            },
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
                    "Thank the user for using the productivity assistant and "
                    "encourage them to have a productive day. End the conversation warmly."
                ),
            },
        ],
        "post_actions": [{"type": "end_conversation"}],
    }


class ProductivityFlowAgent:
    """Main productivity flow agent class that integrates with existing service."""

    def __init__(self):
        self.flow_manager: FlowManager | None = None
        self.task: PipelineTask | None = None

    async def create_flow_pipeline(
        self,
        room_url: str,
        token: str,
        user_id: str | None = None,
    ) -> dict[str, Any]:
        """Create the productivity flow pipeline."""
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
                "Productivity Assistant",
                daily_params,
            )

            # Configure AI services
            llm = OpenAILLMService(
                model="gpt-4o",
            )

            stt = OpenAISTTService(
            )

            tts = OpenAITTSService(
                voice="nova",
            )

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
                logger.debug("Initializing productivity flow")
                await self.flow_manager.initialize(create_initial_node())

            return {
                "room_url": room_url,
                "status": "ready",
                "transport": transport,
                "flow_manager": self.flow_manager,
                "task": self.task,
                "features": [
                    "Task Management",
                    "Schedule Planning",
                    "Goal Setting",
                    "Productivity Coaching",
                ],
            }

        except Exception as e:
            logger.error(f"Failed to create productivity flow pipeline: {e}")
            raise

    async def run_flow(self) -> None:
        """Run the productivity flow."""
        if not self.task:
            raise RuntimeError("Task not initialized. Call create_flow_pipeline first.")

        runner = PipelineRunner()
        await runner.run(self.task)

    def get_user_data(self) -> dict[str, Any]:
        """Get current user productivity data."""
        return {
            "tasks": list(productivity_data.tasks.values()),
            "schedule": list(productivity_data.schedule.values()),
            "goals": list(productivity_data.goals.values()),
            "summary": {
                "total_tasks": len(productivity_data.tasks),
                "total_events": len(productivity_data.schedule),
                "total_goals": len(productivity_data.goals),
            },
        }

    async def cleanup(self) -> None:
        """Clean up flow resources."""
        if self.task and not self.task.done():
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass

        # Clear user data for this session
        productivity_data.tasks.clear()
        productivity_data.schedule.clear()
        productivity_data.goals.clear()
        productivity_data.user_context.clear()


# Global instance
productivity_flow_agent = ProductivityFlowAgent()
