"""
Gemini Vision API wrapper with LangChain for ad analysis.
Provides initial criticism and insights for uploaded advertisement images.
"""

import os
import base64
from typing import Dict, Any

import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI  # still used by follow-up utils
from langchain.prompts import PromptTemplate  # still used by follow-up utils
from langchain.chains import LLMChain  # still used by follow-up utils
import json


def initialize_gemini():
    """Initialize Gemini API with API key from environment."""
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY (or GEMINI_API_KEY) not found in environment variables")
    genai.configure(api_key=api_key)
    return api_key


def analyze_ad_image_with_gemini(image_bytes: bytes, mime_type: str = "image/png") -> Dict[str, Any]:
    """
    Analyze an advertisement image using Gemini Vision API with LangChain.
    
    Args:
        image_bytes: Raw bytes of the image file
        
    Returns:
        Dictionary containing:
        - criticism: Initial critical analysis
        - strengths: Identified strengths
        - weaknesses: Identified weaknesses
        - suggestions: Improvement suggestions
    """
    try:
        # Initialize Gemini
        api_key = initialize_gemini()
        
        # Prepare image data directly (avoid PIL to prevent stream issues)
        image_data = image_bytes

        # Create Gemini model for vision (Flash) and ask for final formatted text directly
        vision_model = genai.GenerativeModel('gemini-flash-latest')

        format_prompt = (
            "You are an AI advertising analyst. Analyze the provided image and return the output EXACTLY in this format with exact line breaks.\n\n"
            "Initial Insight: [1-2 sentences about what this ad accomplishes]\n\n"
            "Strengths:\n"
            "- [Strength 1]\n"
            "- [Strength 2]\n"
            "- [Strength 3]\n\n"
            "Weaknesses:\n"
            "- [Weakness 1]\n"
            "- [Weakness 2]\n"
            "- [Weakness 3]\n\n"
            "Suggested Improvements:\n"
            "1. [Improvement 1]\n"
            "2. [Improvement 2]\n"
            "3. [Improvement 3]"
        )

        image_part = {"mime_type": mime_type or "image/png", "data": image_data}
        response = vision_model.generate_content([format_prompt, image_part])
        text = (response.text or "").strip()
        if not text:
            raise ValueError("Empty response from Gemini")
        return { 'analysis_text': text }
        
    except Exception as e:
        print(f"Error analyzing image with Gemini: {str(e)}")
        # Return a simple error marker used by the backend/frontend
        return { 'analysis_text': f"[AI_ERROR] {str(e)}" }


def parse_structured_response(response: str) -> Dict[str, str]:
    """
    Parse the structured response from LangChain into a dictionary.
    
    Args:
        response: Structured text response
        
    Returns:
        Dictionary with criticism, strengths, weaknesses, suggestions
    """
    result = {
        'criticism': '',
        'strengths': '',
        'weaknesses': '',
        'suggestions': ''
    }
    
    try:
        # Split by sections
        sections = response.split('\n\n')
        
        for section in sections:
            section = section.strip()
            if section.startswith('CRITICISM:'):
                result['criticism'] = section.replace('CRITICISM:', '').strip()
            elif section.startswith('STRENGTHS:'):
                result['strengths'] = section.replace('STRENGTHS:', '').strip()
            elif section.startswith('WEAKNESSES:'):
                result['weaknesses'] = section.replace('WEAKNESSES:', '').strip()
            elif section.startswith('SUGGESTIONS:'):
                result['suggestions'] = section.replace('SUGGESTIONS:', '').strip()
        
        # Fallback: if parsing failed, put everything in criticism
        if not result['criticism']:
            result['criticism'] = response
            
    except Exception as e:
        print(f"Error parsing response: {str(e)}")
        result['criticism'] = response
    
    return result


def get_mock_analysis() -> Dict[str, str]:
    """
    Fallback mock analysis for testing without API key.
    """
    return {
        'criticism': "This ad shows strong visual hierarchy but may benefit from clearer call-to-action placement.",
        'strengths': "- Clean design\n- Good color contrast\n- Professional imagery",
        'weaknesses': "- CTA could be more prominent\n- Text might be too small on mobile\n- Limited emotional appeal",
        'suggestions': "1. Increase CTA button size by 20%\n2. Add testimonial or social proof\n3. Test warmer color palette\n4. Simplify headline for faster comprehension",
        'raw_analysis': "Mock analysis for testing"
    }


def generate_initial_insight_text(
    *,
    acknowledgment: str = "",
    strengths: str = "",
    weaknesses: str = "",
    suggestions: str = "",
    api_key: str | None = None,
) -> str:
    """
    Use LangChain + Gemini to produce a concise, well-formatted Initial Insight.
    Falls back to joining provided strings if LLM is unavailable.
    """
    try:
        key = api_key or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        
        # Parse strengths, weaknesses, and suggestions into lists
        def _parse_to_list(text):
            if not text:
                return []
            lines = [line.strip() for line in str(text).split('\n') if line.strip()]
            # Remove bullet points, numbers, and dashes
            cleaned = []
            for line in lines:
                line = line.lstrip('- •*123456789.').strip()
                if line:
                    cleaned.append(line)
            return cleaned
        
        strength_list = _parse_to_list(strengths)
        weakness_list = _parse_to_list(weaknesses)
        suggestion_list = _parse_to_list(suggestions)
        
        if not key:
            # Fallback without LLM - use clean formatting
            result = f"Initial Insight: {acknowledgment.strip()}\n\n"
            
            if strength_list:
                result += "Strengths:\n"
                for s in strength_list[:3]:
                    result += f"- {s}\n"
                result += "\n"
            
            if weakness_list:
                result += "Weaknesses:\n"
                for w in weakness_list[:3]:
                    result += f"- {w}\n"
                result += "\n"
            
            if suggestion_list:
                result += "Suggested Improvements:\n"
                for i, sug in enumerate(suggestion_list[:5], 1):
                    result += f"{i}. {sug}\n"
            
            return result.strip()

        # Use a supported Gemini chat model name to avoid 404 NotFound errors
        llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", google_api_key=key, temperature=0.3)
        prompt = PromptTemplate(
            input_variables=["acknowledgment", "strengths", "weaknesses", "suggestions"],
            template=(
                "You are an AI advertising analyst. Analyze the provided information and format it EXACTLY as shown below.\n\n"
                "Required format (maintain exact line breaks and structure):\n\n"
                "Initial Insight: [Write 1-2 sentences about what this ad accomplishes or attempts to do]\n\n"
                "Strengths:\n"
                "- [Strength 1]\n"
                "- [Strength 2]\n"
                "- [Strength 3]\n\n"
                "Weaknesses:\n"
                "- [Weakness 1]\n"
                "- [Weakness 2]\n"
                "- [Weakness 3]\n\n"
                "Suggested Improvements:\n"
                "1. [Improvement 1]\n"
                "2. [Improvement 2]\n"
                "3. [Improvement 3]\n\n"
                "Input data:\n"
                "Acknowledgment: {acknowledgment}\n"
                "Strengths: {strengths}\n"
                "Weaknesses: {weaknesses}\n"
                "Suggestions: {suggestions}\n\n"
                "Keep it concise, neutral-positive tone, no jargon. Return ONLY the formatted text above."
            ),
        )
        chain = LLMChain(llm=llm, prompt=prompt)
        text = chain.run(
            acknowledgment=acknowledgment,
            strengths=", ".join(strength_list),
            weaknesses=", ".join(weakness_list),
            suggestions=", ".join(suggestion_list),
        )
        return text.strip()
    except Exception as e:
        print(f"Initial insight generation failed, using fallback: {e}")
        # Fallback formatting
        strength_list = _parse_to_list(strengths) if 'strengths' in locals() else []
        weakness_list = _parse_to_list(weaknesses) if 'weaknesses' in locals() else []
        suggestion_list = _parse_to_list(suggestions) if 'suggestions' in locals() else []
        
        result = f"Initial Insight: {acknowledgment.strip()}\n\n"
        
        if strength_list:
            result += "Strengths:\n"
            for s in strength_list[:3]:
                result += f"- {s}\n"
            result += "\n"
        
        if weakness_list:
            result += "Weaknesses:\n"
            for w in weakness_list[:3]:
                result += f"- {w}\n"
            result += "\n"
        
        if suggestion_list:
            result += "Suggested Improvements:\n"
            for i, sug in enumerate(suggestion_list[:5], 1):
                result += f"{i}. {sug}\n"
        
        return result.strip()


def generate_follow_up_insight_text(
    *,
    resonance: float | int | None,
    engagement: float | int | None,
    hostility: float | int | None,
    controversy: float | int | None,
    total_quality: float | int | None = None,
    themes: list[str] | None = None,
    risks: str | None = None,
    next_actions: list[str] | None = None,
    api_key: str | None = None,
) -> str:
    """
    Use LangChain + Gemini to produce a concise Follow-up Insight (3–4 sentences) per template.
    Falls back to a simple summary when LLM is unavailable.
    """
    try:
        key = api_key or os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        perf = {
            "resonance": resonance,
            "engagement": engagement,
            "hostility": hostility,
            "controversy": controversy,
            "total_quality": total_quality,
        }
        if not key:
            # Fallback simple summary
            summary = [
                f"Follow-up Insight:",
                f"Performance — R:{resonance} E:{engagement} H:{hostility} C:{controversy}" +
                (f" Q:{total_quality}" if total_quality is not None else ""),
            ]
            if themes:
                summary.append("Themes: " + ", ".join(themes[:2]))
            if risks:
                summary.append(f"Risk: {risks}")
            if next_actions:
                summary.append("Next: " + "; ".join(next_actions[:2]))
            return "\n".join(summary)

        llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", google_api_key=key, temperature=0.3)
        prompt = PromptTemplate(
            input_variables=["perf", "themes", "risks", "next_actions"],
            template=(
                "You are an AI advertising analyst. Write a short Follow-up Insight with 3–4 sentences."
                " Use resonance, engagement, hostility, controversy (and total_quality if given)."
                " Summarize dominant sentiment/themes, mention any risks/controversy, and recommend 1–2 next actions.\n\n"
                "Format exactly:\n"
                "Follow-up Insight:\n"
                "[Sentence 1] — Overall performance summary using the metrics.\n"
                "[Sentence 2] — Dominant audience themes or sentiment patterns.\n"
                "[Sentence 3] — Risks/controversies or cohorts with negative response, if any.\n"
                "[Sentence 4] — 1–2 concrete next actions.\n\n"
                "Metrics JSON: {perf}\n"
                "Themes: {themes}\n"
                "Risks: {risks}\n"
                "Next Actions: {next_actions}\n"
            ),
        )
        chain = LLMChain(llm=llm, prompt=prompt)
        text = chain.run(
            perf=json.dumps(perf),
            themes=", ".join(themes or []),
            risks=risks or "",
            next_actions=", ".join(next_actions or []),
        )
        return text.strip()
    except Exception as e:
        print(f"Follow-up insight generation failed, using fallback: {e}")
        summary = [
            f"Follow-up Insight:",
            f"Performance — R:{resonance} E:{engagement} H:{hostility} C:{controversy}" +
            (f" Q:{total_quality}" if total_quality is not None else ""),
        ]
        if themes:
            summary.append("Themes: " + ", ".join(themes[:2]))
        if risks:
            summary.append(f"Risk: {risks}")
        if next_actions:
            summary.append("Next: " + "; ".join(next_actions[:2]))
        return "\n".join(summary)
