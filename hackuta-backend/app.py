from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Request, Response
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
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
from models import User, Image
from schemas import ImageCreateRequest, ImageResponse, UserResponse
from oauth import oauth
from session import (
    set_session_cookie, 
    clear_session_cookie, 
    get_session_user,
    get_current_user_from_session
)

load_dotenv()

app = FastAPI(title="HackUTA Image Analysis API", version="1.0.0")

# Add SessionMiddleware for OAuth (required by Authlib)
SESSION_SECRET = os.getenv("SESSION_SECRET", "change-this-secret-key")
app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET)

# Configure CORS for frontend
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    await init_db()

@app.get("/")
async def hello_world():
    return {"message": "Hello World - HackUTA Image Analysis API"}


# ============================================================================
# AUTHENTICATION ENDPOINTS (OAuth2 with Auth0)
# ============================================================================

@app.get("/auth/login")
async def login(request: Request):
    """
    Initiate OAuth login flow with Auth0
    Redirects user to Auth0 login page
    """
    redirect_uri = request.url_for('auth_callback')
    return await oauth.auth0.authorize_redirect(request, redirect_uri)


@app.get("/auth/callback")
async def auth_callback(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """
    OAuth callback endpoint
    Auth0 redirects here after successful login
    Creates/updates user in database and sets session cookie
    """
    try:
        # Exchange authorization code for token
        token = await oauth.auth0.authorize_access_token(request)
        
        # Get user info from token
        user_info = token.get('userinfo')
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        # Get or create user in database
        user_id = user_info.get('sub')
        email = user_info.get('email')
        name = user_info.get('name')
        
        result = await db.execute(select(User).where(User.user_id == user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            # Create new user
            user = User(
                user_id=user_id,
                email=email,
                name=name
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            # Update existing user info
            user.email = email
            user.name = name
            await db.commit()
        
        # Clear OAuth session data (no longer needed)
        request.session.clear()
        
        # Create session
        session_data = {
            'sub': user_id,
            'email': email,
            'name': name,
        }
        
        # Create session token
        from session import create_session_token
        token = create_session_token(session_data)
        
        # Redirect to frontend callback page with token in URL
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        redirect = RedirectResponse(url=f"{frontend_url}/auth/callback?token={token}")
        
        print(f"DEBUG /auth/callback - Created session token for user: {email}")
        print(f"DEBUG /auth/callback - Redirecting to: {frontend_url}/auth/callback?token=...")
        
        return redirect
        
    except Exception as e:
        # Clear OAuth session on error too
        request.session.clear()
        
        # Redirect to frontend with error
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        return RedirectResponse(url=f"{frontend_url}/?error={str(e)}")


@app.get("/auth/logout")
async def logout(request: Request):
    """
    Logout user
    Since we use localStorage tokens, just clear server session and redirect to frontend
    Frontend already cleared the token before calling this
    """
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # Clear Starlette session (used by OAuth)
    request.session.clear()
    
    # Simple redirect back to frontend
    # Frontend has already cleared localStorage token
    return RedirectResponse(url=frontend_url)


@app.get("/auth/me")
async def get_current_user_info(request: Request):
    """
    Get current user information from session token
    Accepts token via Authorization header: Bearer <token>
    Returns user data or null if not authenticated
    """
    # Check Authorization header
    auth_header = request.headers.get("Authorization")
    print(f"DEBUG /auth/me - Auth header: {auth_header[:50] if auth_header else 'NOT FOUND'}")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        print(f"DEBUG /auth/me - No valid auth header")
        return JSONResponse(content={"user": None})
    
    token = auth_header.replace("Bearer ", "")
    
    from session import verify_session_token
    session_data = verify_session_token(token)
    
    if not session_data:
        print(f"DEBUG /auth/me - Invalid or expired token")
        return JSONResponse(content={"user": None})
    
    print(f"DEBUG /auth/me - Session data found for user: {session_data.get('email')}")
    return JSONResponse(content={"user": session_data})

@app.post("/images", response_model=ImageResponse)
async def create_image(
    request: Request,
    image_data: ImageCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new image record with URL and user association
    """
    # Get current user from session
    current_user = await get_current_user_from_session(request, db)
    
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
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Get all images for the current user
    """
    # Get current user from session
    current_user = await get_current_user_from_session(request, db)
    
    result = await db.execute(
        select(Image).where(Image.user_id == current_user.id).order_by(Image.created_at.desc())
    )
    images = result.scalars().all()
    return images

@app.get("/images/{image_id}", response_model=ImageResponse)
async def get_image(
    image_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific image by ID (only if owned by current user)
    """
    # Get current user from session
    current_user = await get_current_user_from_session(request, db)
    
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
    request: Request,
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload and analyze an image, then save to database with user association
    """
    # Get current user from session
    current_user = await get_current_user_from_session(request, db)
    
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
