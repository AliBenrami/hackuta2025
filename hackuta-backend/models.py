"""
SQLAlchemy models for the application
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, JSON
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
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True) # Allow null if not in a campaign
    tweet_id = Column(String(255), nullable=True)  # Twitter/X tweet ID
    tweet_url = Column(Text, nullable=True)  # Full URL to tweet
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to user
    owner = relationship("User", back_populates="images")
    # Relationship to campaign
    campaign = relationship("Campaign", back_populates="images")
    # Relationship to comments
    comments = relationship("Comment", back_populates="image", cascade="all, delete-orphan")


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
    # Relationship to images
    images = relationship(
        "Image",
        back_populates="campaign",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class Comment(Base):
    """Comment model - stores Twitter/X comments for posted ads"""
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id"), nullable=False)
    comment_id = Column(String(255), nullable=False)  # Twitter comment/reply ID
    text = Column(Text, nullable=False)  # Comment text
    author_id = Column(String(255), nullable=True)  # Twitter user ID
    author_username = Column(String(255), nullable=True)  # Twitter username
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to image
    image = relationship("Image", back_populates="comments")


class CommentArchive(Base):
    """
    Stores the raw JSON for a comment fetched from the X (Twitter) API.
    This provides a separate, clean archive of the original data.
    """

    __tablename__ = "comment_archives"
    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id"), nullable=False)

    # Store the unique ID from Twitter and the timestamp
    comment_id = Column(String(255), nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Store the full, raw JSON response from the X (Twitter) API
    raw_json = Column(JSON, nullable=False)

    # Define a relationship back to the image if needed, though it's one-way for now
    image = relationship("Image")
