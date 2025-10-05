"""
Pydantic schemas for request/response models
"""
from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime

class ImageCreateRequest(BaseModel):
    """Request model for creating an image record"""
    url: HttpUrl
    filename: Optional[str] = None
    content_type: Optional[str] = None
    analysis_text: Optional[str] = None

class ImageResponse(BaseModel):
    """Response model for image data"""
    id: int
    url: str
    filename: Optional[str]
    content_type: Optional[str]
    analysis_text: Optional[str]
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    """Response model for user data"""
    id: int
    user_id: str
    email: Optional[str]
    name: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class Analytics(BaseModel):
    """Aggregated analytics metrics for an analyzed image"""
    quality: float
    hostility: float
    engagement: float
    resonance: float


class AnalyzeImageResponse(BaseModel):
    """Response model for analyze image endpoint including analytics"""
    image: ImageResponse
    analytics: Analytics


class CampaignCreate(BaseModel):
    name: str
    description: str
    emotion: Optional[str] = None
    success: Optional[str] = None
    inspiration: Optional[str] = None


class CampaignResponse(BaseModel):
    id: int
    user_id: int
    name: str
    description: str
    emotion: Optional[str]
    success: Optional[str]
    inspiration: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
