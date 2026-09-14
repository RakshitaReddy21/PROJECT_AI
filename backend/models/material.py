from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from backend.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Material(Base):
    __tablename__ = "materials"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    size_kb = Column(Float, default=0.0, nullable=False)
    status = Column(String, default="uploading", nullable=False)  # 'uploading', 'processing', 'ready', 'failed'
    stage = Column(String, default="uploading", nullable=False)  # 'uploading', 'extracting_text', 'creating_knowledge', 'preparing_search', 'ready'
    pages_count = Column(Integer, default=0, nullable=False)
    concepts_extracted = Column(JSON, default=list, nullable=False)
    searchable = Column(Boolean, default=False, nullable=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    project = relationship("Project", back_populates="materials")
    chunks = relationship("DocumentChunk", back_populates="material", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String, primary_key=True, index=True)
    material_id = Column(String, ForeignKey("materials.id", ondelete="CASCADE"), nullable=False, index=True)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, default=1, nullable=False)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0, nullable=False)
    embedding_json = Column(Text, nullable=True)  # JSON serialized list of floats
    metadata_json = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    material = relationship("Material", back_populates="chunks")
    project = relationship("Project", back_populates="chunks")
