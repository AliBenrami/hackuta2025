from fastapi import UploadFile, File
from typing import Dict, Any
import random
import os
import asyncio
import easyocr
from gemini_wrapper import gemini_ocr
import emoji
import joblib
from textblob import TextBlob
from transformers import AutoTokenizer, AutoModel, pipeline
import torch
import numpy as np
import pandas as pd
from gemini_wrapper import analyze_ad_image_with_gemini

# Load models
tokenizer = AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
embed_model = AutoModel.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
toxicity_model = pipeline("text-classification", model="unitary/toxic-bert")
comment_sentiment_model = joblib.load("../ml/saved_models/comment_sentiment_model.pkl")
ad_receptive_model = joblib.load("../ml/saved_models/ad_receptiveness_model.pkl")

def get_features(text):
    tokens = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        output = embed_model(**tokens)
    emb = output.last_hidden_state.mean(dim=1).squeeze().numpy()

    sentiment_polarity = TextBlob(text).sentiment.polarity
    emoji_count = len(emoji.emoji_list(text))
    question_flag = int("?" in text)
    toxicity = toxicity_model(text)[0]["score"]

    return np.concatenate([emb, [sentiment_polarity, emoji_count, question_flag, toxicity]])


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

    result = {
        "extracted_text": "",
        "generated_comments": "comments"
    }

    # Always attempt Gemini first; fall back to mock on failure
    try:
        # Read image bytes
        image_bytes = await image.read()

        # Analyze with Gemini (simplified: returns analysis_text directly)
        loop = asyncio.get_event_loop()
        gemini_result = await loop.run_in_executor(None, analyze_ad_image_with_gemini, image_bytes, image.content_type or "image/png")
        analysis_text = gemini_result.get('analysis_text', '[AI_ERROR] No text returned')
        cor_text = gemini_ocr(image_bytes, mime_type=image.content_type or "image/png")["ocr_text"]

        # Split into lines
        lines = cor_text.split("\n")

        # Split into sections
        split_index = lines.index("Generated Comments:") if "Generated Comments:" in lines else len(lines)
        extracted_text = " ".join(line for line in lines[:split_index] if line.strip())
        comments = [line.split(". ", 1)[1] for line in lines[split_index + 1:] if line.strip() and line[0].isdigit()]

        result = {
            "extracted_text": extracted_text,
            "generated_comments": comments
        }
        
        ad_text = result["extracted_text"].strip()
        ad_comments = [c.strip() for c in result["generated_comments"] if c.strip()]

        # 1. Predict sentiment for each comment
        comment_results = []
        for comment in ad_comments:
            features = get_features(comment).reshape(1, -1)
            proba = comment_sentiment_model.predict_proba(features)[0]  # [p_neg, p_neu, p_pos]
            score = proba[2] - proba[0]  # positive minus negative
            comment_results.append({"comment": comment, "score": score})

        comment_df = pd.DataFrame(comment_results)
        mean_sentiment = comment_df["score"].mean()
        receptiveness_index = (mean_sentiment + 1) / 2  # normalize to [0, 1]

        print("=== Comment Predictions ===")
        print(comment_df)
        print("\nMean Sentiment:", round(mean_sentiment, 3))
        print("Receptiveness Index:", round(receptiveness_index, 3))

        # 2. Predict ad-level receptiveness using ad text + mean sentiment
        def get_embedding(text):
            tokens = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
            with torch.no_grad():
                out = embed_model(**tokens)
            return out.last_hidden_state.mean(dim=1).squeeze().numpy()

        ad_emb = get_embedding(ad_text)
        X = np.hstack([ad_emb, [mean_sentiment]]).reshape(1, -1)
        predicted_receptiveness = ad_receptive_model.predict(X)[0]

        print("\nPredicted Ad Receptiveness (regression output):", round(predicted_receptiveness, 3))

        # Aggregate toxicity per comment (from get_features)
        avg_toxicity = np.mean([
            toxicity_model(c)[0]["score"] for c in ad_comments
        ]) if ad_comments else 0.0

        # Derive metrics
        analytics = {
            # Sentiment magnitude: high = positive, low = polarizing or unclear
            "quality": round(abs(mean_sentiment), 3),

            # Hostility directly tied to toxicity
            "hostility": round(avg_toxicity, 3),

            # Engagement: how emotionally charged the comments are
            "engagement": round(min(1.0, abs(mean_sentiment) + 0.3 * (1 - avg_toxicity)), 3),

            # Resonance: how much the ad connects — predicted from your regression model
            "resonance": round(max(0.0, min(1.0, predicted_receptiveness)), 3),
        }

        print("ANALYTICSL: ", analytics)
                
        

    except Exception as e:
        # Do NOT return mock content. Mark analysis as an error so frontend can handle it explicitly.
        print(f"Gemini analysis failed: {str(e)}")
        analysis_text = f"[AI_ERROR] {str(e)}"




    return {
        "analysis_text": analysis_text + str(f"\n\n{str(result)}"),
        "analytics": analytics,
    }





