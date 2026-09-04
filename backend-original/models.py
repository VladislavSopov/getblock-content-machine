from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="viewer")  # "admin" or "viewer"
    created_at = Column(DateTime, default=datetime.utcnow)

    batches = relationship("ContentBatch", back_populates="creator")

class ContentBatch(Base):
    __tablename__ = "content_batches"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    source_text = Column(Text, nullable=False)
    content_type = Column(String)
    tone = Column(String)
    audience = Column(String)
    keywords = Column(String)
    preferred_week = Column(String)
    channels = Column(JSON) # List of channels
    created_by = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")  # 'pending', 'done', 'failed'

    creator = relationship("User", back_populates="batches")
    drafts = relationship("ContentDraft", back_populates="batch", cascade="all, delete-orphan")

class ContentDraft(Base):
    __tablename__ = "content_drafts"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id = Column(String, ForeignKey("content_batches.id"))
    channel = Column(String, nullable=False)
    draft_text = Column(Text)
    status = Column(String, default="draft")  # 'draft', 'approved', 'published'
    scheduled_date = Column(String, nullable=True)
    scheduled_time = Column(String, nullable=True)
    ai_reasoning = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    batch = relationship("ContentBatch", back_populates="drafts")

class AppSettings(Base):
    __tablename__ = "app_settings"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    key = Column(String, unique=True, nullable=False, index=True)
    value = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

