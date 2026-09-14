import math
import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class RetrievedChunk(BaseModel):
    id: str
    material_id: str
    material_name: str
    page_number: int
    content: str
    similarity_score: float

class ProjectVectorStore:
    def __init__(self):
        # Maps project_id -> List of chunk dictionaries
        # Each entry: {id, project_id, material_id, material_name, page_number, content, embedding}
        self._project_indexes: Dict[str, List[Dict[str, Any]]] = {}

    def add_chunk(
        self,
        project_id: str,
        chunk_id: str,
        material_id: str,
        material_name: str,
        page_number: int,
        content: str,
        embedding: List[float],
    ):
        if project_id not in self._project_indexes:
            self._project_indexes[project_id] = []
        
        # Avoid duplicate chunk
        existing = [c for c in self._project_indexes[project_id] if c["id"] == chunk_id]
        if not existing:
            self._project_indexes[project_id].append({
                "id": chunk_id,
                "project_id": project_id,
                "material_id": material_id,
                "material_name": material_name,
                "page_number": page_number,
                "content": content,
                "embedding": embedding,
            })

    def search(
        self,
        project_id: str,
        query_embedding: List[float],
        query_text: str = "",
        top_k: int = 4,
    ) -> List[RetrievedChunk]:
        """
        Retrieves top_k chunks strictly within the specified project_id.
        Guarantees zero cross-project retrieval leakage.
        """
        chunks = self._project_indexes.get(project_id, [])
        if not chunks:
            return []

        STOP_WORDS = {
            "a", "an", "the", "and", "or", "but", "if", "in", "on", "at", "to", "for", "of",
            "with", "by", "from", "is", "are", "was", "were", "what", "which", "who", "whom",
            "this", "that", "these", "those", "does", "do", "did", "have", "has", "had", "it",
            "its", "how", "why", "can", "could", "would", "should"
        }
        all_terms = set(re.findall(r"\w+", query_text.lower()))
        query_terms = {t for t in all_terms if t not in STOP_WORDS and len(t) > 2}
        if not query_terms:
            query_terms = all_terms

        scored_chunks = []
        for chunk in chunks:
            # 1. Cosine similarity
            chunk_vec = chunk["embedding"]
            cos_sim = sum(q * c for q, c in zip(query_embedding, chunk_vec))
            
            # 2. Keyword overlap boost
            content_words = set(re.findall(r"\w+", chunk["content"].lower()))
            overlap = len(query_terms.intersection(content_words)) / max(1, len(query_terms)) if query_terms else 0.0

            # If there is zero keyword overlap and low semantic similarity, prune as irrelevant
            if overlap == 0.0 and cos_sim < 0.60:
                continue

            # Combined hybrid score (50% semantic cosine, 50% lexical overlap)
            hybrid_score = (0.5 * cos_sim) + (0.5 * overlap)

            if hybrid_score > 0.12:
                scored_chunks.append((hybrid_score, chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_matches = scored_chunks[:top_k]

        return [
            RetrievedChunk(
                id=item["id"],
                material_id=item["material_id"],
                material_name=item["material_name"],
                page_number=item["page_number"],
                content=item["content"],
                similarity_score=round(float(score), 4),
            )
            for score, item in top_matches
        ]

    def clear_project(self, project_id: str):
        if project_id in self._project_indexes:
            del self._project_indexes[project_id]

# Singleton in-memory store instance
vector_store = ProjectVectorStore()
