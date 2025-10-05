"""
SQLAlchemy models for the application
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    """User model - stores user information from OAuth providers"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(255), unique=True, index=True, nullable=False)  # OAuth sub claim
    email = Column(String(255), unique=True, index=True, nullable=True)
    name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to images
    images = relationship("Image", back_populates="owner", cascade="all, delete-orphan")
    # Relationship to campaigns
    campaigns = relationship("Campaign", back_populates="owner", cascade="all, delete-orphan")

class Image(Base):
    """Image model - stores image URLs and metadata"""
    __tablename__ = "images"
    
    id = Column(Integer, primary_key=True, index=True)
    url = Column(Text, nullable=False)  # Image URL from S3 or external source
    filename = Column(String(255), nullable=True)
    content_type = Column(String(100), nullable=True)
    analysis_text = Column(Text, nullable=True)  # AI analysis results
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to user
    owner = relationship("User", back_populates="images")


class Campaign(Base):
    """Campaign model - stores campaign data for a user"""
    __tablename__ = "campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    emotion = Column(String(255), nullable=True)
    success = Column(String(255), nullable=True)
    inspiration = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to user
    owner = relationship("User", back_populates="campaigns")
