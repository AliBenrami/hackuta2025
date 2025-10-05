"""
X (Twitter) API v2 integration for posting ads and fetching metrics.
"""
import os
import httpx
import asyncio
import json
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Image, Comment, CommentArchive

router = APIRouter(prefix="/api/x", tags=["x"])

X_BEARER_TOKEN = os.getenv("X_BEARER_TOKEN")
X_API_BASE = os.getenv("X_API_BASE", "https://api.x.com/2")
X_USERNAME = os.getenv("X_USERNAME", "NiaziHasna22359")
# The actual tweet ID from the only post on your Twitter profile
X_TWEET_ID = os.getenv("X_TWEET_ID", "REPLACE_WITH_ACTUAL_TWEET_ID")

if not X_BEARER_TOKEN:
    print("WARNING: X_BEARER_TOKEN not set")
print(f"INFO: Will fetch comments from tweet: {X_TWEET_ID}")


class PostTweetRequest(BaseModel):
    text: Optional[str] = None
    image_url: Optional[str] = None


class PostTweetResponse(BaseModel):
    tweet_id: str
    tweet_url: str


@router.post("/post", response_model=PostTweetResponse)
async def post_tweet(payload: PostTweetRequest):
    """
    Post a tweet with optional image to X.
    
    Steps:
    1. If image_url provided, upload media and get media_id
    2. Post tweet with text (and media_id if present)
    3. Return tweet_id and URL
    """
    # Mock mode: bypass Twitter API for demo purposes
    if USE_MOCK_MODE:
        import random
        import time
        mock_tweet_id = f"mock_{int(time.time())}_{random.randint(1000, 9999)}"
        return {
            "tweet_id": mock_tweet_id,
            "tweet_url": f"https://twitter.com/{X_USERNAME}/status/{mock_tweet_id}"
        }
    
    if not X_BEARER_TOKEN:
        raise HTTPException(status_code=500, detail="X_BEARER_TOKEN not configured")
    
    headers = {
        "Authorization": f"Bearer {X_BEARER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        # Step 1: Upload media if image_url is provided
        media_id = None
        if payload.image_url:
            try:
                # Download the image from S3
                img_response = await client.get(payload.image_url)
                img_response.raise_for_status()
                image_data = img_response.content
                
                # Upload to Twitter (v1.1 media endpoint)
                media_headers = {
                    "Authorization": f"Bearer {X_BEARER_TOKEN}",
                }
                
                # Twitter expects multipart/form-data
                files = {"media": ("image.jpg", image_data, "image/jpeg")}
                media_response = await client.post(
                    "https://upload.twitter.com/1.1/media/upload.json",
                    headers=media_headers,
                    files=files,
                )
                media_response.raise_for_status()
                media_json = media_response.json()
                media_id = str(media_json.get("media_id_string"))
                
            except Exception as media_error:
                print(f"Failed to upload media to Twitter: {media_error}")
                # Continue without image if upload fails
        
        # Step 2: Post tweet (X API requires text, use space if none provided)
        tweet_data = {"text": payload.text or " "}
        if media_id:
            tweet_data["media"] = {"media_ids": [media_id]}
        
        try:
            response = await client.post(
                f"{X_API_BASE}/tweets",
                headers=headers,
                json=tweet_data,
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            
            tweet_id = result["data"]["id"]
            username = os.getenv("X_USERNAME", "user")
            tweet_url = f"https://x.com/{username}/status/{tweet_id}"
            
            return PostTweetResponse(tweet_id=tweet_id, tweet_url=tweet_url)
            
        except httpx.HTTPStatusError as e:
            error_detail = e.response.text if e.response else str(e)
            raise HTTPException(
                status_code=e.response.status_code if e.response else 500,
                detail=f"X API error: {error_detail}"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to post tweet: {str(e)}")


@router.get("/metrics/{tweet_id}")
async def get_tweet_metrics(tweet_id: str) -> Dict[str, Any]:
    """
    Fetch public metrics for a tweet.
    
    Returns engagement data: likes, replies, retweets, quotes, views
    """
    if not X_BEARER_TOKEN:
        raise HTTPException(status_code=500, detail="X_BEARER_TOKEN not configured")
    
    headers = {"Authorization": f"Bearer {X_BEARER_TOKEN}"}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{X_API_BASE}/tweets/{tweet_id}",
                headers=headers,
                params={"tweet.fields": "public_metrics"},
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            
            metrics = result.get("data", {}).get("public_metrics", {})
            return {
                "tweet_id": tweet_id,
                "metrics": {
                    "likes": metrics.get("like_count", 0),
                    "replies": metrics.get("reply_count", 0),
                    "retweets": metrics.get("retweet_count", 0),
                    "quotes": metrics.get("quote_count", 0),
                    "views": metrics.get("impression_count", 0)
                }
            }
            
        except httpx.HTTPStatusError as e:
            error_detail = e.response.text if e.response else str(e)
            raise HTTPException(
                status_code=e.response.status_code if e.response else 500,
                detail=f"X API error: {error_detail}"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch metrics: {str(e)}")


@router.get("/comments/{tweet_id}")
async def get_tweet_comments(tweet_id: str, max_results: int = 10) -> Dict[str, Any]:
    """
    Fetch recent comments (replies) to a tweet.
    
    Returns list of comment objects for later sentiment analysis.
    """
    if not X_BEARER_TOKEN:
        raise HTTPException(status_code=500, detail="X_BEARER_TOKEN not configured")
    
    headers = {"Authorization": f"Bearer {X_BEARER_TOKEN}"}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{X_API_BASE}/tweets/search/recent",
                headers=headers,
                params={
                    "query": f"conversation_id:{tweet_id}",
                    "tweet.fields": "author_id,text,created_at",
                    "max_results": min(max_results, 100)
                },
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            
            comments = result.get("data", [])
            return {
                "tweet_id": tweet_id,
                "comment_count": len(comments),
                "comments": comments
            }
            
        except httpx.HTTPStatusError as e:
            error_detail = e.response.text if e.response else str(e)
            raise HTTPException(
                status_code=e.response.status_code if e.response else 500,
                detail=f"X API error: {error_detail}"
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch comments: {str(e)}")


async def fetch_and_store_comments(image_id: int, tweet_id: str):
    """
    Background task: Fetch comments for a tweet and store them in the database.
    This runs 5 minutes after deployment.
    """
    print(f"Waiting 5 minutes before fetching comments for tweet {tweet_id}...")
    await asyncio.sleep(300)  # 5 minutes = 300 seconds
    
    print(f"Fetching comments for tweet {tweet_id}...")
    
    try:
        # Mock mode: generate fake comments
        if USE_MOCK_MODE:
            import random
            mock_comments = [
                {"text": "This looks amazing! 🔥", "username": "user1"},
                {"text": "Great ad! Where can I buy this?", "username": "interested_buyer"},
                {"text": "Love the design 💯", "username": "creative_fan"},
                {"text": "This is exactly what I've been looking for!", "username": "potential_customer"},
                {"text": "Nice work on the visuals", "username": "design_enthusiast"},
            ]
            
            from database import AsyncSessionLocal
            async with AsyncSessionLocal() as db:
                selected_comments = random.sample(mock_comments, random.randint(2, 5))
                
                for idx, comment_data in enumerate(selected_comments):
                    comment = Comment(
                        image_id=image_id,
                        comment_id=f"mock_comment_{tweet_id}_{idx}",
                        text=comment_data["text"],
                        author_id=f"mock_author_{idx}",
                        author_username=comment_data["username"],
                    )
                    db.add(comment)
                
                await db.commit()
                print(f"[MOCK MODE] Stored {len(selected_comments)} mock comments for tweet {tweet_id}")
            return
        
        # Real API mode
        headers = {
            "Authorization": f"Bearer {X_BEARER_TOKEN}",
        }
        
        async with httpx.AsyncClient() as client:
            # Fetch replies to the tweet
            response = await client.get(
                f"{X_API_BASE}/tweets/{tweet_id}/replies",
                headers=headers,
                params={
                    "tweet.fields": "created_at,author_id",
                    "user.fields": "username",
                    "max_results": 100,
                },
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            
            # Store comments in database
            from database import AsyncSessionLocal
            async with AsyncSessionLocal() as db:
                comments_data = data.get("data", [])
                includes = data.get("includes", {})
                users = {u["id"]: u for u in includes.get("users", [])}
                
                for comment_data in comments_data:
                    author_id = comment_data.get("author_id")
                    username = users.get(author_id, {}).get("username") if author_id else None
                    
                    comment = Comment(
                        image_id=image_id,
                        comment_id=comment_data["id"],
                        text=comment_data["text"],
                        author_id=author_id,
                        author_username=username,
                    )
                    db.add(comment)
                
                await db.commit()
                print(f"Stored {len(comments_data)} comments for tweet {tweet_id}")
                
    except Exception as e:
        print(f"Error fetching/storing comments: {e}")


class DeployImageRequest(BaseModel):
    image_id: int


class DeployImageResponse(BaseModel):
    tweet_id: str
    tweet_url: str
    image_id: int


async def fetch_comments_from_tweet(tweet_id: str) -> List[Dict[str, str]]:
    """Fetch comments from a specific tweet"""
    if not X_BEARER_TOKEN:
        raise HTTPException(status_code=500, detail="X_BEARER_TOKEN not configured")
    
    headers = {
        "Authorization": f"Bearer {X_BEARER_TOKEN}",
    }
    
    try:
        async with httpx.AsyncClient() as client:
            # Search for replies to the tweet
            response = await client.get(
                f"{X_API_BASE}/tweets/search/recent",
                headers=headers,
                params={
                    "query": f"conversation_id:{tweet_id}",
                    "tweet.fields": "author_id,created_at",
                    "expansions": "author_id",
                    "user.fields": "username",
                    "max_results": 100,
                },
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            
            # Parse comments
            comments = []
            comments_data = data.get("data", [])
            includes = data.get("includes", {})
            users = {u["id"]: u for u in includes.get("users", [])}
            
            for comment_data in comments_data:
                author_id = comment_data.get("author_id")
                username = users.get(author_id, {}).get("username") if author_id else None
                
                comments.append({
                    "comment_id": comment_data["id"],
                    "text": comment_data["text"],
                    "author_id": author_id or "",
                    "author_username": username or "unknown",
                })
            
            return comments
            
    except httpx.HTTPStatusError as e:
        error_detail = e.response.text if e.response else str(e)
        print(f"Error fetching comments: {error_detail}")
        raise HTTPException(
            status_code=e.response.status_code if e.response else 500,
            detail=f"X API error: {error_detail}"
        )
    except Exception as e:
        print(f"Error fetching comments: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch comments: {str(e)}")


@router.post("/deploy", response_model=DeployImageResponse)
async def deploy_image(
    payload: DeployImageRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Deploy an image:
    1. Fetch comments from the hardcoded Twitter post
    2. Save tweet info to database
    3. Store all comments in database
    """
    # Fetch the image from database
    result = await db.execute(
        select(Image).where(Image.id == payload.image_id)
    )
    image = result.scalar_one_or_none()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # Add a guard clause to ensure the bearer token is configured
    if not X_BEARER_TOKEN:
        raise HTTPException(
            status_code=500, detail="X_BEARER_TOKEN is not configured on the server."
        )

    # Use the hardcoded tweet ID
    tweet_url = f"https://twitter.com/{X_USERNAME}/status/{X_TWEET_ID}"
    
    # Update image with tweet info
    image.tweet_id = X_TWEET_ID
    image.tweet_url = tweet_url
    await db.commit()
    
    # Fetch and store comments immediately
    try:
        comments = await fetch_comments_from_tweet(X_TWEET_ID)
        
        # Store in database
        for comment_data in comments:
            # Check if comment already exists to avoid duplicates
            result = await db.execute(
                select(Comment).where(
                    Comment.comment_id == comment_data["comment_id"]
                )
            )
            existing_comment = result.scalar_one_or_none()

            if not existing_comment:
                # Save to the original comments table
                comment = Comment(
                    image_id=image.id,
                    comment_id=comment_data["comment_id"],
                    text=comment_data["text"],
                    author_id=comment_data["author_id"],
                    author_username=comment_data["author_username"],
                    raw_json=comment_data["raw_json"],
                )
                db.add(comment)

                # Also save the raw JSON to the new archive table
                archive_entry = CommentArchive(
                    image_id=image.id,
                    comment_id=comment_data["comment_id"],
                    raw_json=comment_data["raw_json"],
                )
                db.add(archive_entry)

        await db.commit()
        print(
            f"Stored {len(comments)} comments for image {image.id} and archived raw JSON"
        )

        # Also save the raw JSON to a file for easy inspection
        try:
            output_path = os.path.join(os.path.dirname(__file__), "comments.json")
            with open(output_path, "w") as f:
                json.dump(comments, f, indent=2)
            print(f"Successfully saved comments to {output_path}")
        except Exception as e:
            print(f"Warning: Could not save comments to JSON file: {e}")

    except Exception as e:
        print(f"Warning: Could not fetch comments: {e}")
        # Continue anyway, just without comments
    
    return DeployImageResponse(
        tweet_id=X_TWEET_ID,
        tweet_url=tweet_url,
        image_id=image.id,
    )
