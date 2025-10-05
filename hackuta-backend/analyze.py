from fastapi import UploadFile, File
from typing import Dict, Any
import random
import os
import asyncio

from gemini_wrapper import analyze_ad_image_with_gemini


async def get_analyze_image(image: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Analyze the uploaded image using Gemini Vision API + LangChain.
    Returns structured results including analysis text and analytics metrics.
    """
    analytics = {
        "quality": 0,
        "hostility": 0,
        "engagement": 0,
        "resonance": 0,
    }

    # Always attempt Gemini first; fall back to mock on failure
    try:
        # Read image bytes
        image_bytes = await image.read()

        # Analyze with Gemini (simplified: returns analysis_text directly)
        loop = asyncio.get_event_loop()
        gemini_result = await loop.run_in_executor(None, analyze_ad_image_with_gemini, image_bytes, image.content_type or "image/png")
        analysis_text = gemini_result.get('analysis_text', '[AI_ERROR] No text returned')

    except Exception as e:
        # Do NOT return mock content. Mark analysis as an error so frontend can handle it explicitly.
        print(f"Gemini analysis failed: {str(e)}")
        analysis_text = f"[AI_ERROR] {str(e)}"

    # Return whole-number dummy metrics for UI display
    # These will be replaced by the hybrid model when "Deploy" is clicked


    return {
        "analysis_text": analysis_text,
        "analytics": analytics,
    }





