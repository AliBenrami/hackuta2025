from sklearn.model_selection import train_test_split
from textblob import TextBlob
import emoji
import pandas as pd
from transformers import pipeline, AutoTokenizer, AutoModel
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
import torch
import numpy as np
from pathlib import Path
import joblib
import os

np.set_printoptions(suppress=True, precision=3)

tokenizer = AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
embed_model = AutoModel.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
toxicity_model = pipeline("text-classification", model="unitary/toxic-bert")

comment_root = "datasets/comment_labels"
path = Path(comment_root)
dataset = []
for file in path.iterdir():
    print(file.name)
    data = pd.read_json(file)
    print(data.shape)
    dataset.append(data)

dataset = pd.concat(dataset, ignore_index=True)
print(dataset.columns)
print(dataset["label"].value_counts())

texts = dataset["text"]
labels = dataset["label"]

def get_embedding(text):
    tokens = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        output = embed_model(**tokens)
    return output.last_hidden_state.mean(dim=1).squeeze().numpy()
# rows = []
# for text in texts:
#     emb = get_embedding(text)
#     sentiment_polarity = TextBlob(text).sentiment.polarity
#     emoji_count = len(emoji.emoji_list(text))
#     question_flag = int("?" in text)
#     toxicity = toxicity_model(text)[0]["score"]
#     extra = np.array([sentiment_polarity, emoji_count, question_flag, toxicity])
#     full_vec = np.concatenate([emb, extra])
#     rows.append(full_vec)

X = pd.read_csv("embeddings.csv").to_numpy()
Y = pd.read_csv("labels.csv").squeeze().to_numpy()

from sklearn.metrics import classification_report

X_train, X_test, y_train, y_test = train_test_split(X, Y, test_size=0.2, random_state=42)

model = make_pipeline(StandardScaler(), LogisticRegression(max_iter=1000))
model.fit(X_train, y_train)
y_pred = model.predict(X_test)
y_proba = model.predict_proba(X_test)

for pred, prob in zip(y_pred, y_proba):
    print(f"pred: {pred}, prob: {prob}")

save_dir = "saved_models"
os.makedirs(save_dir, exist_ok=True)

joblib.dump(model, f"{save_dir}/comment_sentiment_model.pkl")
print("Model saved to", f"{save_dir}/comment_sentiment_model.pkl")

print(classification_report(y_test, y_pred))

