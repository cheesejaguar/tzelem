"""
Vercel serverless function wrapper for FastAPI backend.
This file serves as the entry point for Vercel Functions.
"""
import os
import sys
from pathlib import Path

# Add backend directory to Python path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# Set up environment
os.environ.setdefault("DEBUG", "false")

# Monkey patch missing modules for Vercel deployment
class MockModule:
    """Mock module for missing dependencies in Vercel environment"""
    def __getattr__(self, name):
        # Return a callable that does nothing
        return lambda *args, **kwargs: None
    
    def __call__(self, *args, **kwargs):
        return MockModule()

# Mock heavy dependencies that aren't available in Vercel
# This allows the app to start even without these packages
pipecat_modules = [
    'pipecat',
    'pipecat.audio',
    'pipecat.audio.vad',
    'pipecat.frames',
    'pipecat.frames.frames',
    'pipecat.pipeline',
    'pipecat.pipeline.pipeline',
    'pipecat.pipeline.runner',
    'pipecat.pipeline.task',
    'pipecat.processors',
    'pipecat.processors.aggregators',
    'pipecat.processors.frame_processor',
    'pipecat.services',
    'pipecat.services.ai_services',
    'pipecat.services.openai',
    'pipecat.services.deepgram',
    'pipecat.services.elevenlabs',
    'pipecat.transports',
    'pipecat.transports.base_input',
    'pipecat.transports.base_output',
    'pipecat.transports.services',
    'pipecat.transports.services.daily',
    'pipecat_flows',
    'onnxruntime',
    'loguru',
    'silero_vad',
    'daily',
]

for module_name in pipecat_modules:
    sys.modules[module_name] = MockModule()

# Import the FastAPI app
from backend.main import app

# Export the app as 'handler' for Vercel
# Vercel will use this to handle requests
handler = app