# Backend Documentation

### ⚙️ **Backend (Next.js API routes + FastAPI microservice)**

- **Next.js API Routes:** Handle user requests and interface with CockroachDB
- **FastAPI microservice:** Handles ML analysis (runs locally or as a containerized service)

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 18+
- pip (Python package manager)
- npm (Node package manager)

### Installation & Setup

1. **Install Python dependencies:**

   ```bash
   cd hackuta-backend
   pip install -r requirements.txt
   ```

2. **Start the FastAPI microservice:**

   ```bash
    uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```

   The FastAPI service will be available at `http://localhost:8000`

3. **Start the Next.js frontend (from hackuta-frontend directory):**
   ```bash
   cd ../hackuta-frontend
   npm install
   npm run dev
   ```
   The Next.js app will be available at `http://localhost:3000`

## API Endpoints

### `/api/analyze`

**Purpose:** Sends content to FastAPI for LLM + vision critique

**Method:** `POST`

**Request Body:**

```json
{
  "content": "Your social media post content",
  "image_url": "https://example.com/image.jpg",
  "platform": "twitter"
}
```

**Response:**

```json
{
  "critique": "Detailed analysis of your content...",
  "suggestions": ["Suggestion 1", "Suggestion 2"],
  "score": 8.5,
  "categories": ["engagement", "clarity", "brand_voice"]
}
```

**Usage Example:**

```javascript
const response = await fetch("/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    content: "Check out our new product! 🚀",
    image_url: "https://example.com/product.jpg",
    platform: "twitter",
  }),
});
```

---

### `/api/post`

**Purpose:** Posts to Twitter via OAuth and stores post ID

**Method:** `POST`

**Request Body:**

```json
{
  "content": "Your tweet content",
  "image_url": "https://example.com/image.jpg",
  "access_token": "your_oauth_token"
}
```

**Response:**

```json
{
  "success": true,
  "post_id": "1234567890123456789",
  "url": "https://twitter.com/user/status/1234567890123456789",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Usage Example:**

```javascript
const response = await fetch("/api/post", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    content: "Just launched our new feature! 🎉",
    image_url: "https://example.com/feature.jpg",
    access_token: "your_oauth_token",
  }),
});
```

---

### `/api/fetch-metrics`

**Purpose:** Retrieves engagement metrics for posted ads

**Method:** `GET`

**Query Parameters:**

- `post_id` (required): The Twitter post ID
- `access_token` (required): OAuth access token

**Response:**

```json
{
  "post_id": "1234567890123456789",
  "metrics": {
    "likes": 42,
    "retweets": 8,
    "replies": 12,
    "impressions": 1250,
    "engagement_rate": 4.96
  },
  "timestamp": "2024-01-15T11:00:00Z"
}
```

**Usage Example:**

```javascript
const response = await fetch(
  "/api/fetch-metrics?post_id=1234567890123456789&access_token=your_token"
);
const metrics = await response.json();
```

---

### `/api/feedback-summary`

**Purpose:** Combines initial critique + performance data

**Method:** `GET`

**Query Parameters:**

- `post_id` (required): The Twitter post ID
- `access_token` (required): OAuth access token

**Response:**

```json
{
  "post_id": "1234567890123456789",
  "initial_critique": {
    "score": 8.5,
    "suggestions": ["Original suggestions..."],
    "categories": ["engagement", "clarity"]
  },
  "performance_metrics": {
    "likes": 42,
    "retweets": 8,
    "engagement_rate": 4.96
  },
  "final_analysis": {
    "prediction_accuracy": "High",
    "lessons_learned": ["What worked well", "Areas for improvement"],
    "recommendations": ["Future content suggestions"]
  }
}
```

**Usage Example:**

```javascript
const response = await fetch(
  "/api/feedback-summary?post_id=1234567890123456789&access_token=your_token"
);
const summary = await response.json();
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Twitter API Credentials
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret

# Database
COCKROACH_DB_URL=your_cockroachdb_connection_string

# FastAPI Service
FASTAPI_BASE_URL=http://localhost:8000

# OpenAI API (for LLM analysis)
OPENAI_API_KEY=your_openai_api_key
```

## Development

### Running in Development Mode

```bash
# Terminal 1 - FastAPI backend
cd hackuta-backend
python app.py

# Terminal 2 - Next.js frontend
cd hackuta-frontend
npm run dev
```

### Testing Endpoints

Use tools like Postman, curl, or the browser's developer console to test the API endpoints.

**Example curl command:**

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "Test post", "platform": "twitter"}'
```
