import sys
from pathlib import Path

import pytest

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))


@pytest.fixture(autouse=True)
def _isolate_mail_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Keep a developer's .env (loaded by core.config) from leaking into tests."""
    monkeypatch.delenv("AGENTMAIL_INBOX_ID", raising=False)
    monkeypatch.delenv("DEBUG", raising=False)
