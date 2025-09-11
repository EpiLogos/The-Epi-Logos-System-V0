"""
Bimba Coordinate Metadata Models for LightRAG Integration
"""

from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field


class BimbaCoordinateMetadata(BaseModel):
    """Metadata structure for Bimba coordinate system"""
    source_coordinate: str = Field(..., description="e.g., '#4.2.3'")
    section_coordinates: List[str] = Field(default_factory=list)
    namespace: str = Field(default="gnostic")
    ontological_level: int = Field(..., ge=0, le=5)
    process_type: str = Field(..., description="e.g., 'dialogical-identity'")
    

class BimbaDocument(BaseModel):
    """Extended document model with coordinate metadata"""
    content: str
    source_id: str
    metadata: BimbaCoordinateMetadata
    

class BimbaChunk(BaseModel):
    """Chunk model preserving coordinate context"""
    content: str
    parent_coordinate: str
    chunk_coordinate: str
    metadata: Dict[str, Any]


def split_into_chunks(content: str, chunk_size: int = 1000) -> List[str]:
    """Split content into chunks for processing"""
    words = content.split()
    chunks = []
    current_chunk = []
    current_size = 0
    
    for word in words:
        if current_size + len(word) > chunk_size and current_chunk:
            chunks.append(" ".join(current_chunk))
            current_chunk = [word]
            current_size = len(word)
        else:
            current_chunk.append(word)
            current_size += len(word) + 1  # +1 for space
    
    if current_chunk:
        chunks.append(" ".join(current_chunk))
    
    return chunks


def build_coordinate_kg(doc: BimbaDocument) -> Dict:
    """Build custom KG with coordinate metadata preservation"""
    chunks = split_into_chunks(doc.content)
    
    return {
        "entities": [
            {
                "entity_name": f"doc_{doc.source_id}",
                "entity_type": "Document", 
                "description": f"Document with coordinate {doc.metadata.source_coordinate}",
                "source_id": doc.source_id,
                "source_coordinate": doc.metadata.source_coordinate,
                "section_coordinates": doc.metadata.section_coordinates,
                "coordinate_metadata": doc.metadata.model_dump()
            }
        ],
        "chunks": [
            {
                "content": chunk_content,
                "source_id": doc.source_id,
                "parent_coordinate": doc.metadata.source_coordinate,
                "chunk_coordinate": f"{doc.metadata.source_coordinate}.chunk_{i:02d}",
                "coordinate_metadata": {
                    "inherits_from": doc.metadata.source_coordinate,
                    "chunk_index": i,
                    "namespace": doc.metadata.namespace
                }
            } for i, chunk_content in enumerate(chunks)
        ]
    }