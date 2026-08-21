import os
import sys

# Ensure workspace root and Backend/ are in sys.path
workspace_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(workspace_root, "Backend")
for p in (workspace_root, backend_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

from tests.database.conftest import mock_client, mock_db, seeded_mock_db

__all__ = ["mock_client", "mock_db", "seeded_mock_db"]
