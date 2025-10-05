"""
Session management for authentication
Simple cookie-based sessions
"""
import os
from typing import Optional
from fastapi import Request, Response, HTTPException, status
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import User
from database import get_db

# Secret key for signing session cookies
SECRET_KEY = os.getenv("SESSION_SECRET", "your-secret-key-change-in-production")
SESSION_COOKIE_NAME = "session"
SESSION_MAX_AGE = 60 * 60 * 24 * 7  # 7 days

# Serializer for signing session data
serializer = URLSafeTimedSerializer(SECRET_KEY)


def create_session_token(user_data: dict) -> str:
    """Create a signed session token"""
    return serializer.dumps(user_data)


def verify_session_token(token: str) -> Optional[dict]:
    """Verify and decode a session token"""
    try:
        return serializer.loads(token, max_age=SESSION_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None


def set_session_cookie(response: Response, user_data: dict):
    """Set session cookie on response"""
    token = create_session_token(user_data)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=SESSION_MAX_AGE,
        httponly=True,
        secure=os.getenv("ENVIRONMENT") == "production",
        samesite="lax",
    )


def clear_session_cookie(response: Response):
    """Clear session cookie"""
    response.delete_cookie(key=SESSION_COOKIE_NAME)


async def get_session_user(request: Request) -> Optional[dict]:
    """Get user data from session cookie"""
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        return None
    return verify_session_token(token)


async def get_current_user_from_session(
    request: Request,
    db: AsyncSession
) -> User:
    """
    Get current user from session cookie
    Dependency for protected routes
    """
    session_data = await get_session_user(request)
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    user_id = session_data.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session"
        )
    
    # Get user from database
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user
