import emoji
import joblib
from textblob import TextBlob
from transformers import AutoTokenizer, AutoModel, pipeline
import torch
import numpy as np
import pandas as pd

# Load models
tokenizer = AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
embed_model = AutoModel.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
toxicity_model = pipeline("text-classification", model="unitary/toxic-bert")
comment_sentiment_model = joblib.load("saved_models/comment_sentiment_model.pkl")
ad_receptive_model = joblib.load("saved_models/ad_receptiveness_model.pkl")

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

# Input ad and comments
ad_text = "Introducing our new eco-friendly sneakers made from recycled ocean plastic!"
ad_comments = [
    "These look amazing, definitely buying a pair!",
    "Not sure about the price though.",
    "Finally a company doing something good for the planet.",
    "They look weird, I’ll stick with my old shoes.",
    "Is the sole durable enough for running?",
]

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
