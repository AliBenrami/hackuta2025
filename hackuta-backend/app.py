from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import Annotated, List
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, select
from sqlalchemy.orm import sessionmaker, relationship, declarative_base
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from dotenv import load_dotenv
from analyze import get_analyze_image
from util import upload_image
import os

# Import our new modules
from database import get_db, init_db
from auth import get_current_user
from models import User, Image
from schemas import ImageCreateRequest, ImageResponse, UserResponse

load_dotenv()

app = FastAPI(title="HackUTA Image Analysis API", version="1.0.0")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    await init_db()

@app.get("/")
async def hello_world():
    return {"message": "Hello World"}

@app.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@app.post("/images", response_model=ImageResponse)
async def create_image(
    image_data: ImageCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new image record with URL and user association
    """
    # Create new image record
    image = Image(
        url=str(image_data.url),
        filename=image_data.filename,
        content_type=image_data.content_type,
        analysis_text=image_data.analysis_text,
        user_id=current_user.id
    )
    
    db.add(image)
    await db.commit()
    await db.refresh(image)
    
    return image

@app.get("/images", response_model=List[ImageResponse])
async def get_user_images(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all images for the current user
    """
    result = await db.execute(
        select(Image).where(Image.user_id == current_user.id).order_by(Image.created_at.desc())
    )
    images = result.scalars().all()
    return images

@app.get("/images/{image_id}", response_model=ImageResponse)
async def get_image(
    image_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific image by ID (only if owned by current user)
    """
    result = await db.execute(
        select(Image).where(
            Image.id == image_id,
            Image.user_id == current_user.id
        )
    )
    image = result.scalar_one_or_none()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return image



@app.post("/analyze/image", response_model=ImageResponse)
async def analyze_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload and analyze an image, then save to database with user association
    """
    # Validate file type
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Get S3 bucket name from environment
    bucket_name = os.getenv("S3_BUCKET_NAME", "your-default-bucket-name")
    
    # Upload image directly to S3
    try:
        image_info = upload_image(
            file_obj=image.file,
            bucket=bucket_name,
            filename=image.filename or "image",
            content_type=image.content_type
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")
    
    # Analyze the image
    analyze_text = get_analyze_image(image)
    
    # Create image record in database
    image_record = Image(
        url=image_info.url,
        filename=image.filename,
        content_type=image.content_type,
        analysis_text=analyze_text,
        user_id=current_user.id
    )
    
    db.add(image_record)
    await db.commit()
    await db.refresh(image_record)
    
    return image_record





if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
