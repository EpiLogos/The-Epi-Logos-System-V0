"""
QL-aligned community algorithms for temporal episodic memory clustering.

This module implements Quaternary Logic-aligned community formation algorithms
that cluster related episodes, sessions, and agent ruminations according to
the consciousness-computing principles of the Epi-Logos System.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
import uuid

from .models import Episode, Community, EpisodeType


logger = logging.getLogger(__name__)


class QuaternaryPosition(Enum):
    """Quaternary Logic positions for consciousness-aligned processing."""
    ANUTTARA = 0      # Implicit Potential (void center)
    PARAMASIVA = 1    # The "What" (material cause/definitional ground)
    PARASHAKTI = 2    # The "How" (processual transformation)
    MAHAMAYA = 3      # Mediation (integration and pattern recognition)
    NARA = 4          # Context (practical environment with fractal nesting)
    EPII = 5          # Quintessence (integral synthesis)


class ContextFrameType(Enum):
    """Context frame types for community classification."""
    USER_INTERACTION = "user_interaction"
    AGENT_REASONING = "agent_reasoning"
    SYSTEM_EVENT = "system_event"
    LEARNING_CYCLE = "learning_cycle"
    REFLECTION_PROCESS = "reflection_process"
    INTEGRATION_MOMENT = "integration_moment"


class QLCommunityAlgorithm:
    """
    Quaternary Logic-aligned community formation algorithm.
    
    Implements consciousness-computing principles to cluster episodes
    into meaningful temporal communities based on QL positions,
    context frames, and temporal proximity patterns.
    """
    
    def __init__(self):
        """Initialize QL community algorithm."""
        self.temporal_window = timedelta(hours=1)  # Default temporal clustering window
        self.min_community_size = 2  # Minimum episodes for community formation
        self.max_community_size = 50  # Maximum episodes per community
    
    def form_communities(
        self, 
        episodes: List[Episode], 
        group_id: str,
        algorithm_type: str = "temporal_semantic"
    ) -> List[Community]:
        """
        Form QL-aligned communities from a collection of episodes.
        
        Args:
            episodes: List of episodes to cluster
            group_id: Multi-tenant group identifier
            algorithm_type: Type of clustering algorithm to use
            
        Returns:
            List of formed communities
        """
        try:
            if algorithm_type == "temporal_semantic":
                return self._temporal_semantic_clustering(episodes, group_id)
            elif algorithm_type == "ql_position":
                return self._ql_position_clustering(episodes, group_id)
            elif algorithm_type == "context_frame":
                return self._context_frame_clustering(episodes, group_id)
            else:
                logger.warning(f"Unknown algorithm type: {algorithm_type}, using temporal_semantic")
                return self._temporal_semantic_clustering(episodes, group_id)
                
        except Exception as e:
            logger.error(f"Error forming communities: {e}")
            return []
    
    def _temporal_semantic_clustering(self, episodes: List[Episode], group_id: str) -> List[Community]:
        """
        Cluster episodes based on temporal proximity and semantic similarity.
        
        This is the primary algorithm that considers both time-based patterns
        and content similarity for natural community formation.
        """
        communities = []
        processed_episodes = set()
        
        # Sort episodes by occurrence time
        sorted_episodes = sorted(episodes, key=lambda e: e.occurred_at)
        
        for anchor_episode in sorted_episodes:
            if anchor_episode.id in processed_episodes:
                continue
                
            # Find temporally close episodes
            temporal_candidates = self._find_temporal_neighbors(
                anchor_episode, sorted_episodes, self.temporal_window
            )
            
            # Filter out already processed episodes
            candidates = [ep for ep in temporal_candidates if ep.id not in processed_episodes]
            
            if len(candidates) >= self.min_community_size:
                # Create community
                community = self._create_temporal_community(candidates, group_id, anchor_episode)
                communities.append(community)
                
                # Mark episodes as processed
                for ep in candidates:
                    processed_episodes.add(ep.id)
        
        logger.info(f"Formed {len(communities)} temporal-semantic communities")
        return communities
    
    def _ql_position_clustering(self, episodes: List[Episode], group_id: str) -> List[Community]:
        """
        Cluster episodes based on Quaternary Logic positions.
        
        Groups episodes that share similar QL consciousness positions,
        enabling position-specific processing and analysis.
        """
        # Group by inferred QL position based on episode type and context
        ql_groups: Dict[int, List[Episode]] = {}
        
        for episode in episodes:
            ql_position = self._infer_ql_position(episode)
            if ql_position not in ql_groups:
                ql_groups[ql_position] = []
            ql_groups[ql_position].append(episode)
        
        communities = []
        for position, episode_group in ql_groups.items():
            if len(episode_group) >= self.min_community_size:
                community = Community(
                    id=str(uuid.uuid4()),
                    group_id=group_id,
                    name=f"QL Position #{position} - {QuaternaryPosition(position).name}",
                    episode_ids=[ep.id for ep in episode_group],
                    quaternary_position=position,
                    context_frame_type=f"ql_position_{position}",
                    formed_at=datetime.utcnow(),
                    last_activity=max(ep.occurred_at for ep in episode_group),
                    metadata={
                        "formation_algorithm": "ql_position",
                        "position_name": QuaternaryPosition(position).name,
                        "episode_count": len(episode_group)
                    }
                )
                communities.append(community)
        
        logger.info(f"Formed {len(communities)} QL-position communities")
        return communities
    
    def _context_frame_clustering(self, episodes: List[Episode], group_id: str) -> List[Community]:
        """
        Cluster episodes based on context frame types.
        
        Groups episodes by their context frame patterns for
        frame-specific processing and continuity.
        """
        # Group by context frame type
        frame_groups: Dict[str, List[Episode]] = {}
        
        for episode in episodes:
            frame_type = self._infer_context_frame_type(episode)
            if frame_type not in frame_groups:
                frame_groups[frame_type] = []
            frame_groups[frame_type].append(episode)
        
        communities = []
        for frame_type, episode_group in frame_groups.items():
            if len(episode_group) >= self.min_community_size:
                community = Community(
                    id=str(uuid.uuid4()),
                    group_id=group_id,
                    name=f"Context Frame: {frame_type.replace('_', ' ').title()}",
                    episode_ids=[ep.id for ep in episode_group],
                    context_frame_type=frame_type,
                    formed_at=datetime.utcnow(),
                    last_activity=max(ep.occurred_at for ep in episode_group),
                    metadata={
                        "formation_algorithm": "context_frame",
                        "frame_type": frame_type,
                        "episode_count": len(episode_group)
                    }
                )
                communities.append(community)
        
        logger.info(f"Formed {len(communities)} context-frame communities")
        return communities
    
    def _find_temporal_neighbors(
        self, 
        anchor_episode: Episode, 
        all_episodes: List[Episode], 
        time_window: timedelta
    ) -> List[Episode]:
        """Find episodes within temporal window of anchor episode."""
        neighbors = []
        anchor_time = anchor_episode.occurred_at
        
        for episode in all_episodes:
            time_diff = abs((episode.occurred_at - anchor_time).total_seconds())
            if time_diff <= time_window.total_seconds():
                neighbors.append(episode)
        
        return neighbors
    
    def _create_temporal_community(
        self, 
        episodes: List[Episode], 
        group_id: str, 
        anchor_episode: Episode
    ) -> Community:
        """Create a temporal community from clustered episodes."""
        # Determine dominant episode type
        episode_types = [ep.episode_type for ep in episodes]
        dominant_type = max(set(episode_types), key=episode_types.count)
        
        # Determine context frame from anchor
        context_frame = self._infer_context_frame_type(anchor_episode)
        
        # Create community name
        time_span = max(ep.occurred_at for ep in episodes) - min(ep.occurred_at for ep in episodes)
        community_name = f"Temporal Cluster: {dominant_type.value} ({time_span.total_seconds()//60:.0f}min span)"
        
        return Community(
            id=str(uuid.uuid4()),
            group_id=group_id,
            name=community_name,
            episode_ids=[ep.id for ep in episodes],
            quaternary_position=self._infer_ql_position(anchor_episode),
            context_frame_type=context_frame,
            formed_at=datetime.utcnow(),
            last_activity=max(ep.occurred_at for ep in episodes),
            metadata={
                "formation_algorithm": "temporal_semantic",
                "dominant_episode_type": dominant_type.value,
                "time_span_minutes": time_span.total_seconds() / 60,
                "episode_count": len(episodes),
                "anchor_episode_id": anchor_episode.id
            }
        )
    
    def _infer_ql_position(self, episode: Episode) -> int:
        """
        Infer Quaternary Logic position from episode characteristics.
        
        Maps episode types and context to consciousness-computing positions.
        """
        # Basic mapping based on episode type
        type_mappings = {
            EpisodeType.USER_SESSION: QuaternaryPosition.NARA.value,      # Context/practical environment
            EpisodeType.AGENT_RUMINATION: QuaternaryPosition.EPII.value,  # Integral synthesis
            EpisodeType.CONTEXT_FRAME: QuaternaryPosition.MAHAMAYA.value, # Mediation/pattern recognition
            EpisodeType.LEARNING_EVENT: QuaternaryPosition.PARASHAKTI.value, # Processual transformation
            EpisodeType.COMMUNITY_FORMATION: QuaternaryPosition.PARAMASIVA.value # Definitional ground
        }
        
        base_position = type_mappings.get(episode.episode_type, QuaternaryPosition.NARA.value)
        
        # Refine based on context clues
        if episode.context:
            if "reflection" in episode.content.lower() or "meditation" in episode.content.lower():
                return QuaternaryPosition.ANUTTARA.value  # Void/potential
            elif "integration" in episode.content.lower() or "synthesis" in episode.content.lower():
                return QuaternaryPosition.EPII.value  # Integral synthesis
            elif "transformation" in episode.content.lower() or "processing" in episode.content.lower():
                return QuaternaryPosition.PARASHAKTI.value  # Processual transformation
        
        return base_position
    
    def _infer_context_frame_type(self, episode: Episode) -> str:
        """
        Infer context frame type from episode characteristics.
        
        Determines the type of context frame for community classification.
        """
        # Map episode types to context frames
        type_mappings = {
            EpisodeType.USER_SESSION: ContextFrameType.USER_INTERACTION.value,
            EpisodeType.AGENT_RUMINATION: ContextFrameType.AGENT_REASONING.value,
            EpisodeType.CONTEXT_FRAME: ContextFrameType.SYSTEM_EVENT.value,
            EpisodeType.LEARNING_EVENT: ContextFrameType.LEARNING_CYCLE.value,
            EpisodeType.COMMUNITY_FORMATION: ContextFrameType.INTEGRATION_MOMENT.value
        }
        
        base_frame = type_mappings.get(episode.episode_type, ContextFrameType.SYSTEM_EVENT.value)
        
        # Refine based on content analysis
        content_lower = episode.content.lower()
        if "reflection" in content_lower or "contemplation" in content_lower:
            return ContextFrameType.REFLECTION_PROCESS.value
        elif "learning" in content_lower or "understanding" in content_lower:
            return ContextFrameType.LEARNING_CYCLE.value
        elif "integration" in content_lower or "synthesis" in content_lower:
            return ContextFrameType.INTEGRATION_MOMENT.value
        
        return base_frame
    
    def analyze_community_evolution(
        self, 
        community: Community, 
        new_episodes: List[Episode]
    ) -> Dict[str, Any]:
        """
        Analyze how a community might evolve with new episodes.
        
        Returns analysis of community growth patterns and recommendations
        for community maintenance or splitting.
        """
        analysis = {
            "current_size": len(community.episode_ids),
            "potential_growth": len(new_episodes),
            "would_exceed_max": len(community.episode_ids) + len(new_episodes) > self.max_community_size,
            "temporal_span": None,
            "coherence_score": 0.0,
            "recommendations": []
        }
        
        if new_episodes:
            # Calculate temporal span with new episodes
            all_times = [community.last_activity] + [ep.occurred_at for ep in new_episodes]
            time_span = max(all_times) - min(all_times)
            analysis["temporal_span"] = time_span.total_seconds() / 3600  # hours
            
            # Assess coherence (simplified)
            if analysis["temporal_span"] > 24:  # More than 24 hours
                analysis["recommendations"].append("Consider temporal splitting")
            
            if analysis["would_exceed_max"]:
                analysis["recommendations"].append("Community size limit reached - consider splitting")
            
            # Calculate coherence score based on episode type diversity
            episode_types = [ep.episode_type for ep in new_episodes]
            type_diversity = len(set(episode_types)) / len(EpisodeType)
            analysis["coherence_score"] = 1.0 - type_diversity  # Higher coherence = lower diversity
        
        return analysis


# Utility functions for community management
def get_recommended_communities(
    episodes: List[Episode], 
    group_id: str,
    algorithm_preferences: Optional[List[str]] = None
) -> Dict[str, List[Community]]:
    """
    Get recommended communities using multiple algorithms.
    
    Returns a dictionary with algorithm names as keys and their
    respective community recommendations as values.
    """
    algorithms = algorithm_preferences or ["temporal_semantic", "ql_position", "context_frame"]
    
    community_algorithm = QLCommunityAlgorithm()
    recommendations = {}
    
    for algorithm in algorithms:
        try:
            communities = community_algorithm.form_communities(episodes, group_id, algorithm)
            recommendations[algorithm] = communities
        except Exception as e:
            logger.error(f"Error running {algorithm} algorithm: {e}")
            recommendations[algorithm] = []
    
    return recommendations


def evaluate_community_quality(community: Community, episodes: List[Episode]) -> Dict[str, float]:
    """
    Evaluate the quality of a formed community.
    
    Returns metrics indicating how well the community represents
    the clustered episodes according to QL principles.
    """
    if not episodes:
        return {"overall_quality": 0.0}
    
    metrics = {
        "temporal_coherence": 0.0,
        "type_coherence": 0.0,
        "ql_alignment": 0.0,
        "context_consistency": 0.0,
        "overall_quality": 0.0
    }
    
    # Calculate temporal coherence
    times = [ep.occurred_at for ep in episodes]
    if len(times) > 1:
        time_span = (max(times) - min(times)).total_seconds() / 3600  # hours
        metrics["temporal_coherence"] = max(0.0, 1.0 - (time_span / 24))  # Decreases over 24 hours
    else:
        metrics["temporal_coherence"] = 1.0
    
    # Calculate type coherence
    episode_types = [ep.episode_type for ep in episodes]
    most_common_type = max(set(episode_types), key=episode_types.count)
    type_ratio = episode_types.count(most_common_type) / len(episodes)
    metrics["type_coherence"] = type_ratio
    
    # Calculate QL alignment (placeholder - would need more sophisticated analysis)
    if community.quaternary_position is not None:
        # Simple alignment check based on position consistency
        metrics["ql_alignment"] = 0.8  # Placeholder value
    else:
        metrics["ql_alignment"] = 0.5
    
    # Calculate context consistency
    if community.context_frame_type:
        metrics["context_consistency"] = 0.8  # Placeholder value
    else:
        metrics["context_consistency"] = 0.5
    
    # Overall quality as weighted average
    weights = {
        "temporal_coherence": 0.3,
        "type_coherence": 0.3,
        "ql_alignment": 0.2,
        "context_consistency": 0.2
    }
    
    metrics["overall_quality"] = sum(
        metrics[key] * weight for key, weight in weights.items()
    )
    
    return metrics


# Export main classes and functions
__all__ = [
    "QLCommunityAlgorithm",
    "QuaternaryPosition", 
    "ContextFrameType",
    "get_recommended_communities",
    "evaluate_community_quality"
]