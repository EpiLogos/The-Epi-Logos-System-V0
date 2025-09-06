"""
Test configuration and fixtures for Graphiti service tests.

This module provides common test fixtures, configuration, and utilities
for testing the Graphiti MCP Foundation service.
"""

import pytest
import asyncio
import os
from typing import Generator
from unittest.mock import Mock, AsyncMock

from ..service import GraphitiService
from ..models import EpisodeType, Episode, Community
from ...database.neo4j_client import Neo4jClient


# Test configuration
TEST_GROUP_ID = "test-group-12345"
TEST_WORKSPACE_ID = "test-workspace"


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def mock_neo4j_client():
    """Create a mock Neo4j client for testing."""
    mock_client = Mock(spec=Neo4jClient)
    mock_client.uri = "bolt://localhost:7687"
    mock_client.username = "neo4j"
    mock_client.password = "test_password"
    mock_client.database = "neo4j"
    mock_client.test_connection.return_value = True
    mock_client.execute_query = AsyncMock(return_value=([], None, []))
    mock_client.close = Mock()
    return mock_client


@pytest.fixture
def sample_episode():
    """Create a sample episode for testing."""
    from datetime import datetime, timezone
    return Episode(
        id="test-episode-123",
        group_id=TEST_GROUP_ID,
        episode_type=EpisodeType.USER_SESSION,
        content="Sample episode content for testing",
        context={"test_context": "value"},
        occurred_at=datetime.now(timezone.utc),
        ingested_at=datetime.now(timezone.utc),
        user_id="user-123",
        session_id="session-456",
        agent_id=None
    )


@pytest.fixture
def sample_agent_rumination():
    """Create a sample agent rumination episode for testing."""
    from datetime import datetime, timezone
    return Episode(
        id="test-rumination-456",
        group_id=TEST_GROUP_ID,
        episode_type=EpisodeType.AGENT_RUMINATION,
        content="Agent reflecting on user interaction patterns and preferences",
        context={"reflection_type": "user_analysis", "confidence": 0.85},
        occurred_at=datetime.now(timezone.utc),
        ingested_at=datetime.now(timezone.utc),
        user_id=None,
        session_id="session-456",
        agent_id="agent-789"
    )


@pytest.fixture
def sample_community():
    """Create a sample community for testing."""
    from datetime import datetime, timezone
    return Community(
        id="test-community-789",
        group_id=TEST_GROUP_ID,
        name="Test User Session Community",
        episode_ids=["test-episode-123", "test-episode-124", "test-episode-125"],
        quaternary_position=4,  # NARA position
        context_frame_type="user_interaction",
        formed_at=datetime.now(timezone.utc),
        last_activity=datetime.now(timezone.utc),
        metadata={"formation_algorithm": "temporal_semantic", "episode_count": 3}
    )


@pytest.fixture
def sample_episodes_list(sample_episode, sample_agent_rumination):
    """Create a list of sample episodes for testing."""
    return [sample_episode, sample_agent_rumination]


@pytest.fixture
def mock_graphiti_core():
    """Mock the Graphiti core library."""
    import sys
    from unittest.mock import MagicMock
    
    # Create mock module
    mock_graphiti = MagicMock()
    mock_instance = MagicMock()
    
    # Configure mock methods
    mock_instance.add_episode = AsyncMock()
    mock_instance.search = AsyncMock(return_value=[])
    mock_instance.set_workspace = Mock()
    mock_instance.close = AsyncMock()
    
    mock_graphiti.return_value = mock_instance
    
    # Mock the import
    sys.modules['graphiti_core'] = MagicMock()
    sys.modules['graphiti_core'].Graphiti = mock_graphiti
    sys.modules['graphiti_core'].search = MagicMock()
    sys.modules['graphiti_core'].search.SearchConfig = MagicMock()
    sys.modules['graphiti_core'].search.HybridSearchInput = MagicMock()
    sys.modules['graphiti_core'].search.SearchMethod = MagicMock()
    
    yield mock_instance
    
    # Cleanup
    if 'graphiti_core' in sys.modules:
        del sys.modules['graphiti_core']


@pytest.fixture
async def graphiti_service(mock_neo4j_client, mock_graphiti_core):
    """Create a GraphitiService instance for testing."""
    with pytest.importorskip("backend.services.graphiti.service"):
        service = GraphitiService(mock_neo4j_client, TEST_WORKSPACE_ID)
        service.graphiti = mock_graphiti_core
        yield service
        await service.close()


@pytest.fixture
def integration_test_config():
    """Configuration for integration tests."""
    return {
        "neo4j_uri": os.getenv("NEO4J_URI", "bolt://localhost:7687"),
        "neo4j_username": os.getenv("NEO4J_USERNAME", "neo4j"),
        "neo4j_password": os.getenv("NEO4J_PASSWORD", "test"),
        "neo4j_database": os.getenv("NEO4J_DATABASE", "neo4j"),
        "workspace_id": "integration-test-workspace",
        "group_id": "integration-test-group"
    }


@pytest.fixture
def skip_integration_if_no_neo4j():
    """Skip integration tests if Neo4j is not available."""
    if not os.getenv("NEO4J_URI"):
        pytest.skip("Integration tests require NEO4J_URI environment variable")


# Test data generators
def create_test_episode_data(
    episode_type: EpisodeType = EpisodeType.USER_SESSION,
    group_id: str = TEST_GROUP_ID,
    **kwargs
) -> dict:
    """Create test episode data dictionary."""
    from datetime import datetime, timezone
    
    base_data = {
        "group_id": group_id,
        "episode_type": episode_type,
        "content": f"Test {episode_type.value} episode",
        "context": {},
        "occurred_at": datetime.now(timezone.utc),
        "user_id": None,
        "session_id": None,
        "agent_id": None
    }
    
    base_data.update(kwargs)
    return base_data


def create_test_community_data(
    group_id: str = TEST_GROUP_ID,
    **kwargs
) -> dict:
    """Create test community data dictionary."""
    base_data = {
        "group_id": group_id,
        "name": "Test Community",
        "episode_ids": [],
        "quaternary_position": None,
        "context_frame_type": None
    }
    
    base_data.update(kwargs)
    return base_data


# Test utilities
class TestDataManager:
    """Utility class for managing test data lifecycle."""
    
    def __init__(self, neo4j_client):
        self.neo4j_client = neo4j_client
        self.created_episodes = []
        self.created_communities = []
    
    async def create_test_episode(self, episode_data: dict) -> str:
        """Create a test episode and track it for cleanup."""
        episode_id = f"test-{len(self.created_episodes)}"
        
        # Store episode in tracking list
        self.created_episodes.append(episode_id)
        
        # Return episode ID for test use
        return episode_id
    
    async def create_test_community(self, community_data: dict) -> str:
        """Create a test community and track it for cleanup."""
        community_id = f"test-community-{len(self.created_communities)}"
        
        # Store community in tracking list
        self.created_communities.append(community_id)
        
        # Return community ID for test use
        return community_id
    
    async def cleanup(self):
        """Clean up all created test data."""
        # Clean up episodes
        if self.created_episodes:
            query = """
            MATCH (ep:Episode:Graphiti)
            WHERE ep.id IN $episode_ids
            DELETE ep
            """
            await self.neo4j_client.execute_query(query, {"episode_ids": self.created_episodes})
        
        # Clean up communities
        if self.created_communities:
            query = """
            MATCH (c:Community:Graphiti)
            WHERE c.id IN $community_ids
            DETACH DELETE c
            """
            await self.neo4j_client.execute_query(query, {"community_ids": self.created_communities})


@pytest.fixture
async def test_data_manager(mock_neo4j_client):
    """Create a test data manager for test lifecycle management."""
    manager = TestDataManager(mock_neo4j_client)
    yield manager
    await manager.cleanup()


# Performance testing utilities
@pytest.fixture
def performance_timer():
    """Timer utility for performance testing."""
    import time
    
    class Timer:
        def __init__(self):
            self.start_time = None
            self.end_time = None
        
        def start(self):
            self.start_time = time.time()
        
        def stop(self):
            self.end_time = time.time()
        
        @property
        def elapsed(self):
            if self.start_time and self.end_time:
                return self.end_time - self.start_time
            return None
    
    return Timer()


# Markers for test categorization
def pytest_configure(config):
    """Configure pytest markers."""
    config.addinivalue_line("markers", "unit: mark test as a unit test")
    config.addinivalue_line("markers", "integration: mark test as an integration test")
    config.addinivalue_line("markers", "performance: mark test as a performance test")
    config.addinivalue_line("markers", "mcp: mark test as MCP protocol related")
    config.addinivalue_line("markers", "api: mark test as FastAPI related")
    config.addinivalue_line("markers", "community: mark test as community algorithm related")


# Custom assertions
def assert_episode_equal(episode1: Episode, episode2: Episode, ignore_timestamps: bool = True):
    """Custom assertion for comparing episodes."""
    assert episode1.id == episode2.id
    assert episode1.group_id == episode2.group_id
    assert episode1.episode_type == episode2.episode_type
    assert episode1.content == episode2.content
    assert episode1.user_id == episode2.user_id
    assert episode1.session_id == episode2.session_id
    assert episode1.agent_id == episode2.agent_id
    
    if not ignore_timestamps:
        assert episode1.occurred_at == episode2.occurred_at
        assert episode1.ingested_at == episode2.ingested_at


def assert_community_equal(community1: Community, community2: Community, ignore_timestamps: bool = True):
    """Custom assertion for comparing communities."""
    assert community1.id == community2.id
    assert community1.group_id == community2.group_id
    assert community1.name == community2.name
    assert set(community1.episode_ids) == set(community2.episode_ids)
    assert community1.quaternary_position == community2.quaternary_position
    assert community1.context_frame_type == community2.context_frame_type
    
    if not ignore_timestamps:
        assert community1.formed_at == community2.formed_at
        assert community1.last_activity == community2.last_activity