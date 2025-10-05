from pathlib import Path
import pandas as pd
import numpy as np
import torch
from transformers import AutoTokenizer, AutoModel, pipeline
from textblob import TextBlob
import emoji
import joblib

model = joblib.load("saved_models/comment_sentiment_model.pkl")

df = []

root_path = "datasets/ad_labels"
path = Path(root_path)
for item in path.iterdir():
    df.append(pd.read_json(item))
df = pd.concat(df, ignore_index=True)
tokenizer = AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
embed_model = AutoModel.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
toxicity_model = pipeline("text-classification", model="unitary/toxic-bert")

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

pred_rows = []
for _, row in df.iterrows():
    features = get_features(row["comment"]).reshape(1, -1)
    proba = model.predict_proba(features)[0]  # [p_neg, p_neu, p_pos]
    score = proba[2] - proba[0]               # positive minus negative as scalar
    pred_rows.append({
        "ad_id": row["ad_id"],
        "ad_text": row["ad_text"],
        "comment": row["comment"],
        "score": score
    })

pred_df = pd.DataFrame(pred_rows)

# Aggregate by advertisement
agg_df = (
    pred_df.groupby(["ad_id", "ad_text"])["score"]
    .mean()
    .reset_index()
    .rename(columns={"score": "mean_sentiment"})
)

agg_df["receptiveness_index"] = (agg_df["mean_sentiment"] + 1) / 2

agg_df.to_csv("aggregated_ad_performance.csv", index=False)

print(agg_df)

