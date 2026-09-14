from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.orm import relationship
from backend.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="learner", nullable=False)  # 'learner', 'admin'
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    spaces = relationship("Space", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    activity_events = relationship("ActivityEvent", back_populates="user", cascade="all, delete-orphan")
