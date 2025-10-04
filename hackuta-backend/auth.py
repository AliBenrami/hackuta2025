"""
JWT authentication utilities for Auth0-style tokens
"""
import os
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import User

# Load environment variables
AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")
AUTH0_ALGORITHMS = ["RS256"]

# Security scheme
security = HTTPBearer()

# Cache for JWKS (JSON Web Key Set)
jwks_cache = {}

async def get_jwks():
    """
    Fetch and cache JWKS from Auth0
    """
    import aiohttp
    if not jwks_cache:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"https://{AUTH0_DOMAIN}/.well-known/jwks.json") as response:
                jwks_cache.update(await response.json())
    return jwks_cache

def get_rsa_key(token: str, jwks: dict):
    """
    Get RSA key for token verification
    """
    from jose import jwk
    from jose.utils import base64url_decode
    
    unverified_header = jwt.get_unverified_header(token)
    rsa_key = {}
    
    for key in jwks["keys"]:
        if key["kid"] == unverified_header["kid"]:
            rsa_key = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"]
            }
            break
    
    if rsa_key:
        return jwk.construct(rsa_key)
    return None

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Verify JWT token and return payload
    """
    token = credentials.credentials
    
    try:
        # Get JWKS
        jwks = await get_jwks()
        
        # Get RSA key
        rsa_key = get_rsa_key(token, jwks)
        if not rsa_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find appropriate key"
            )
        
        # Verify token
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=AUTH0_ALGORITHMS,
            audience=AUTH0_AUDIENCE,
            issuer=f"https://{AUTH0_DOMAIN}/"
        )
        
        return payload
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

async def get_current_user(
    payload: dict = Depends(verify_token),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get current user from token payload and database
    """
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing sub claim"
        )
    
    # Get or create user
    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        # Create new user
        user = User(
            user_id=user_id,
            email=payload.get("email"),
            name=payload.get("name")
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    return user
