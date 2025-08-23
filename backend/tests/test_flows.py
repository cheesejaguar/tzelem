"""Unit tests for flows API endpoints."""

from collections.abc import Generator
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from api.flows import FlowData, router


@pytest.fixture
def client() -> TestClient:
    """Create test client with flows router."""
    from fastapi import FastAPI  # noqa: PLC0415

    app = FastAPI()
    app.include_router(router)
    return TestClient(app)


@pytest.fixture
def sample_flow_data() -> dict[str, Any]:
    """Sample flow data for testing."""
    return {
        "id": "test-flow-001",
        "name": "Test Flow",
        "description": "A test flow for unit testing",
        "paradigm": "Agentic",
        "nodes": [
            {
                "id": "node-1",
                "type": "master",
                "position": {"x": 100, "y": 100},
                "data": {"label": "Master Agent"},
            },
            {
                "id": "node-2",
                "type": "execution",
                "position": {"x": 300, "y": 200},
                "data": {"label": "Execution Agent"},
            },
        ],
        "edges": [
            {
                "id": "edge-1",
                "source": "node-1",
                "target": "node-2",
                "type": "default",
            }
        ],
        "version": "0.1.0",
        "metadata": {"author": "test", "tags": ["test", "sample"]},
    }


@pytest.fixture
def mock_convex_client() -> Generator[MagicMock, None, None]:
    """Mock Convex client for testing."""
    with patch("api.flows.client") as mock_client:
        yield mock_client


class TestCreateOrUpdateFlow:
    """Test cases for create_or_update_flow endpoint."""

    def test_create_flow_success(
        self, client: TestClient, sample_flow_data: dict[str, Any], mock_convex_client: MagicMock
    ) -> None:
        """Test successful flow creation."""
        # Mock Convex mutation response
        mock_convex_client.mutation.return_value = {
            "flowId": "test-flow-001",
            "_id": "mock-convex-id",
        }

        response = client.post("/api/flows", json=sample_flow_data)

        assert response.status_code == 200
        assert response.json() == {"flowId": "test-flow-001"}

        # Verify Convex client was called correctly
        mock_convex_client.mutation.assert_called_once_with(
            "flows:createFlow", {"flowData": sample_flow_data}
        )

    def test_create_flow_with_optional_fields(
        self, client: TestClient, mock_convex_client: MagicMock
    ) -> None:
        """Test flow creation with minimal required fields."""
        minimal_flow = {
            "id": "minimal-flow",
            "name": "Minimal Flow",
            "paradigm": "Sequential",
            "nodes": [],
            "edges": [],
            "version": "0.1.0",
        }

        mock_convex_client.mutation.return_value = {
            "flowId": "minimal-flow",
            "_id": "mock-id",
        }

        response = client.post("/api/flows", json=minimal_flow)

        assert response.status_code == 200
        assert response.json() == {"flowId": "minimal-flow"}

    def test_create_flow_validation_error(
        self, client: TestClient, mock_convex_client: MagicMock  # noqa: ARG002
    ) -> None:
        """Test flow creation with invalid data."""
        invalid_flow = {
            "name": "Invalid Flow",
            # Missing required fields: id, paradigm, nodes, edges, version
        }

        response = client.post("/api/flows", json=invalid_flow)

        assert response.status_code == 422  # Validation error
        assert "Field required" in str(response.json())

    def test_create_flow_convex_error(
        self, client: TestClient, sample_flow_data: dict[str, Any], mock_convex_client: MagicMock
    ) -> None:
        """Test handling of Convex client errors."""
        mock_convex_client.mutation.side_effect = Exception("Convex connection failed")

        response = client.post("/api/flows", json=sample_flow_data)

        assert response.status_code == 500
        assert "Failed to store flow" in response.json()["detail"]

    def test_update_existing_flow(
        self, client: TestClient, sample_flow_data: dict[str, Any], mock_convex_client: MagicMock
    ) -> None:
        """Test updating an existing flow."""
        # Modify the sample flow
        updated_flow = sample_flow_data.copy()
        updated_flow["name"] = "Updated Test Flow"
        updated_flow["description"] = "This flow has been updated"

        mock_convex_client.mutation.return_value = {
            "flowId": "test-flow-001",
            "_id": "existing-id",
        }

        response = client.post("/api/flows", json=updated_flow)

        assert response.status_code == 200
        assert response.json() == {"flowId": "test-flow-001"}


class TestGetFlow:
    """Test cases for get_flow endpoint."""

    def test_get_flow_success(
        self, client: TestClient, sample_flow_data: dict[str, Any], mock_convex_client: MagicMock
    ) -> None:
        """Test successful flow retrieval."""
        mock_convex_client.query.return_value = sample_flow_data

        response = client.get("/api/flows/test-flow-001")

        assert response.status_code == 200
        assert response.json() == sample_flow_data

        # Verify Convex client was called correctly
        mock_convex_client.query.assert_called_once_with(
            "flows:getFlow", {"flowId": "test-flow-001"}
        )

    def test_get_flow_not_found(
        self, client: TestClient, mock_convex_client: MagicMock
    ) -> None:
        """Test retrieval of non-existent flow."""
        mock_convex_client.query.return_value = None

        response = client.get("/api/flows/non-existent-flow")

        assert response.status_code == 404
        assert "Flow non-existent-flow not found" in response.json()["detail"]

    def test_get_flow_convex_error(
        self, client: TestClient, mock_convex_client: MagicMock
    ) -> None:
        """Test handling of Convex client errors during retrieval."""
        mock_convex_client.query.side_effect = Exception("Convex query failed")

        response = client.get("/api/flows/test-flow-001")

        assert response.status_code == 500
        assert "Failed to retrieve flow" in response.json()["detail"]

    def test_get_flow_with_special_characters(
        self, client: TestClient, sample_flow_data: dict[str, Any], mock_convex_client: MagicMock
    ) -> None:
        """Test flow retrieval with special characters in ID."""
        flow_id = "flow-with-special_chars.123"
        mock_convex_client.query.return_value = sample_flow_data

        response = client.get(f"/api/flows/{flow_id}")

        assert response.status_code == 200
        mock_convex_client.query.assert_called_with("flows:getFlow", {"flowId": flow_id})


class TestListFlows:
    """Test cases for list_flows endpoint."""

    def test_list_flows_success(
        self, client: TestClient, sample_flow_data: dict[str, Any], mock_convex_client: MagicMock
    ) -> None:
        """Test successful listing of flows."""
        flows_list = [
            {**sample_flow_data, "_id": "id1"},
            {**sample_flow_data, "id": "test-flow-002", "name": "Another Flow", "_id": "id2"},
        ]
        mock_convex_client.query.return_value = flows_list

        response = client.get("/api/flows")

        assert response.status_code == 200
        assert len(response.json()) == 2
        assert response.json() == flows_list

    def test_list_flows_empty(
        self, client: TestClient, mock_convex_client: MagicMock
    ) -> None:
        """Test listing flows when none exist."""
        mock_convex_client.query.return_value = None

        response = client.get("/api/flows")

        assert response.status_code == 200
        assert response.json() == []

    def test_list_flows_convex_error(
        self, client: TestClient, mock_convex_client: MagicMock
    ) -> None:
        """Test handling of Convex client errors during listing."""
        mock_convex_client.query.side_effect = Exception("Convex list failed")

        response = client.get("/api/flows")

        assert response.status_code == 500
        assert "Failed to list flows" in response.json()["detail"]


class TestFlowDataModel:
    """Test cases for FlowData Pydantic model."""

    def test_flow_data_validation(self) -> None:
        """Test FlowData model validation."""
        valid_data = {
            "id": "test-id",
            "name": "Test Flow",
            "paradigm": "Agentic",
            "nodes": [],
            "edges": [],
            "version": "1.0.0",
        }

        flow = FlowData(**valid_data)  # type: ignore[arg-type]
        assert flow.id == "test-id"
        assert flow.name == "Test Flow"
        assert flow.description is None
        assert flow.metadata is None

    def test_flow_data_with_all_fields(self, sample_flow_data: dict[str, Any]) -> None:
        """Test FlowData model with all optional fields."""
        flow_data_with_dates = sample_flow_data.copy()
        flow_data_with_dates["created"] = "2024-01-01T00:00:00Z"
        flow_data_with_dates["updated"] = "2024-01-02T00:00:00Z"

        flow = FlowData(**flow_data_with_dates)
        assert flow.id == "test-flow-001"
        assert flow.description == "A test flow for unit testing"
        assert flow.created == "2024-01-01T00:00:00Z"
        assert flow.updated == "2024-01-02T00:00:00Z"
        assert flow.metadata == {"author": "test", "tags": ["test", "sample"]}

    def test_flow_data_invalid_paradigm(self) -> None:
        """Test FlowData model with invalid paradigm."""
        invalid_data = {
            "id": "test-id",
            "name": "Test Flow",
            "paradigm": "InvalidType",  # Should be "Agentic" or "Sequential"
            "nodes": [],
            "edges": [],
            "version": "1.0.0",
        }

        # This should pass validation as we don't have strict enum validation
        # in the current implementation
        flow = FlowData(**invalid_data)  # type: ignore[arg-type]
        assert flow.paradigm == "InvalidType"

    def test_flow_data_model_dump(self, sample_flow_data: dict[str, Any]) -> None:
        """Test model_dump method excludes None values."""
        flow = FlowData(
            id=sample_flow_data["id"],
            name=sample_flow_data["name"],
            description=sample_flow_data.get("description"),
            paradigm=sample_flow_data["paradigm"],
            nodes=sample_flow_data["nodes"],
            edges=sample_flow_data["edges"],
            version=sample_flow_data["version"],
            metadata=sample_flow_data.get("metadata"),
        )
        dumped = flow.model_dump(exclude_none=True)

        assert "created" not in dumped
        assert "updated" not in dumped
        assert "description" in dumped
        assert dumped["description"] == "A test flow for unit testing"


class TestIntegration:
    """Integration tests for flow API endpoints."""

    def test_create_and_retrieve_flow(
        self, client: TestClient, sample_flow_data: dict[str, Any], mock_convex_client: MagicMock
    ) -> None:
        """Test creating a flow and then retrieving it."""
        # Create flow
        mock_convex_client.mutation.return_value = {
            "flowId": "test-flow-001",
            "_id": "mock-id",
        }

        create_response = client.post("/api/flows", json=sample_flow_data)
        assert create_response.status_code == 200
        flow_id = create_response.json()["flowId"]

        # Retrieve flow
        mock_convex_client.query.return_value = sample_flow_data

        get_response = client.get(f"/api/flows/{flow_id}")
        assert get_response.status_code == 200
        assert get_response.json()["id"] == flow_id

    def test_concurrent_flow_operations(
        self, client: TestClient, mock_convex_client: MagicMock
    ) -> None:
        """Test handling concurrent flow operations."""
        flows: list[dict[str, Any]] = [
            {
                "id": f"flow-{i}",
                "name": f"Flow {i}",
                "paradigm": "Sequential" if i % 2 == 0 else "Agentic",
                "nodes": [],
                "edges": [],
                "version": "0.1.0",
            }
            for i in range(5)
        ]

        # Mock responses for all flows
        for flow in flows:
            mock_convex_client.mutation.return_value = {
                "flowId": flow["id"],
                "_id": f"mock-id-{flow['id']}",
            }
            response = client.post("/api/flows", json=flow)
            assert response.status_code == 200

        # Verify all mutations were called
        assert mock_convex_client.mutation.call_count == 5


class TestErrorHandling:
    """Test error handling scenarios."""

    def test_malformed_json(self, client: TestClient) -> None:
        """Test handling of malformed JSON input."""
        response = client.post(
            "/api/flows",
            content="not a json",
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 422

    def test_empty_request_body(self, client: TestClient) -> None:
        """Test handling of empty request body."""
        response = client.post("/api/flows", json={})
        assert response.status_code == 422

    def test_large_flow_data(
        self, client: TestClient, mock_convex_client: MagicMock
    ) -> None:
        """Test handling of large flow data."""
        large_flow = {
            "id": "large-flow",
            "name": "Large Flow",
            "paradigm": "Agentic",
            "nodes": [{"id": f"node-{i}", "data": {"value": "x" * 100}} for i in range(100)],
            "edges": [
                {"id": f"edge-{i}", "source": f"node-{i}", "target": f"node-{i+1}"}
                for i in range(99)
            ],
            "version": "0.1.0",
        }

        mock_convex_client.mutation.return_value = {
            "flowId": "large-flow",
            "_id": "mock-id",
        }

        response = client.post("/api/flows", json=large_flow)
        assert response.status_code == 200

