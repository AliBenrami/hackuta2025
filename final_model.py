from transformers import AutoTokenizer, AutoModel
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error
import torch, numpy as np, pandas as pd

df = pd.read_csv("ad_receptiveness.csv")
tokenizer = AutoTokenizer.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")
embed_model = AutoModel.from_pretrained("sentence-transformers/all-MiniLM-L6-v2")

def get_embedding(text):
    tokens = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad():
        out = embed_model(**tokens)
    return out.last_hidden_state.mean(dim=1).squeeze().numpy()

# Build feature matrix: [embedding + mean_sentiment]
embeddings = np.vstack([get_embedding(t) for t in df["ad_text"]])

mean_sentiment = df["mean_sentiment"].to_numpy().reshape(-1, 1)
X = np.hstack([embeddings, mean_sentiment])

# Target: receptiveness_index
y = df["receptiveness_index"].to_numpy()

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = Ridge(alpha=1.0)
model.fit(X_train, y_train)

pred = model.predict(X_test)
print("R²:", r2_score(y_test, pred))
mse = mean_squared_error(y_test, pred)
rmse = np.sqrt(mse)
print("RMSE:", rmse)
import joblib, os
os.makedirs("saved_models", exist_ok=True)
joblib.dump(model, "saved_models/ad_receptiveness_model.pkl")
