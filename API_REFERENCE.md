# API Reference

Complete reference for all backend API endpoints.

## Base URL

```
Development: http://localhost:8000
Production: https://api.yourdomain.com
```

## Authentication

All endpoints except authentication routes require a valid session cookie.

**Cookie Name:** `session`  
**Cookie Type:** HttpOnly, Signed  
**Expiry:** 7 days

## Endpoints

### Authentication

#### `GET /auth/login`

Initiate OAuth login flow with Auth0.

**Response:** Redirect to Auth0 login page

**Example:**
```bash
curl -X GET http://localhost:8000/auth/login
```

---

#### `GET /auth/callback`

OAuth callback endpoint. Auth0 redirects here after successful authentication.

**Query Parameters:**
- `code` (string): Authorization code from Auth0
- `state` (string): State parameter for CSRF protection

**Response:** Redirect to frontend with session cookie set

**Example:**
```
# This is called automatically by Auth0
http://localhost:8000/auth/callback?code=xxx&state=yyy
```

---

#### `GET /auth/logout`

Logout the current user.

**Response:** Redirect to Auth0 logout, then back to frontend

**Example:**
```bash
curl -X GET http://localhost:8000/auth/logout \
  --cookie "session=xxx"
```

---

#### `GET /auth/me`

Get current user information from session.

**Authentication:** Optional (returns null if not authenticated)

**Response:**
```json
{
  "user": {
    "sub": "auth0|123456789",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

Or if not authenticated:
```json
{
  "user": null
}
```

**Example:**
```bash
curl -X GET http://localhost:8000/auth/me \
  --cookie "session=xxx"
```

---

### Images

#### `GET /images`

Get all images for the current user.

**Authentication:** Required

**Response:**
```json
[
  {
    "id": 1,
    "url": "https://s3.amazonaws.com/bucket/image1.jpg",
    "filename": "image1.jpg",
    "content_type": "image/jpeg",
    "analysis_text": "A photo of a cat",
    "user_id": 1,
    "created_at": "2025-10-05T12:00:00Z",
    "updated_at": "2025-10-05T12:00:00Z"
  }
]
```

**Example:**
```bash
curl -X GET http://localhost:8000/images \
  --cookie "session=xxx"
```

---

#### `GET /images/{image_id}`

Get a specific image by ID.

**Authentication:** Required (must own the image)

**Path Parameters:**
- `image_id` (integer): The image ID

**Response:**
```json
{
  "id": 1,
  "url": "https://s3.amazonaws.com/bucket/image1.jpg",
  "filename": "image1.jpg",
  "content_type": "image/jpeg",
  "analysis_text": "A photo of a cat",
  "user_id": 1,
  "created_at": "2025-10-05T12:00:00Z",
  "updated_at": "2025-10-05T12:00:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Image doesn't exist or not owned by user
- `401 Unauthorized`: Not authenticated

**Example:**
```bash
curl -X GET http://localhost:8000/images/1 \
  --cookie "session=xxx"
```

---

#### `POST /images`

Create a new image record with URL.

**Authentication:** Required

**Request Body:**
```json
{
  "url": "https://s3.amazonaws.com/bucket/image1.jpg",
  "filename": "image1.jpg",
  "content_type": "image/jpeg",
  "analysis_text": "A photo of a cat"
}
```

**Response:**
```json
{
  "id": 1,
  "url": "https://s3.amazonaws.com/bucket/image1.jpg",
  "filename": "image1.jpg",
  "content_type": "image/jpeg",
  "analysis_text": "A photo of a cat",
  "user_id": 1,
  "created_at": "2025-10-05T12:00:00Z",
  "updated_at": "2025-10-05T12:00:00Z"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/images \
  --cookie "session=xxx" \
  --header "Content-Type: application/json" \
  --data '{
    "url": "https://s3.amazonaws.com/bucket/image1.jpg",
    "filename": "image1.jpg",
    "content_type": "image/jpeg",
    "analysis_text": "A photo of a cat"
  }'
```

---

#### `POST /analyze/image`

Upload and analyze an image file.

**Authentication:** Required

**Request:**
- Content-Type: `multipart/form-data`
- Form field: `image` (file)

**Response:**
```json
{
  "id": 1,
  "url": "https://s3.amazonaws.com/bucket/image1.jpg",
  "filename": "image1.jpg",
  "content_type": "image/jpeg",
  "analysis_text": "A photo of a cat",
  "user_id": 1,
  "created_at": "2025-10-05T12:00:00Z",
  "updated_at": "2025-10-05T12:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: File is not an image
- `500 Internal Server Error`: Failed to upload to S3

**Example:**
```bash
curl -X POST http://localhost:8000/analyze/image \
  --cookie "session=xxx" \
  --form "image=@/path/to/image.jpg"
```

---

### Health Check

#### `GET /`

Health check endpoint.

**Authentication:** Not required

**Response:**
```json
{
  "message": "Hello World - HackUTA Image Analysis API"
}
```

**Example:**
```bash
curl -X GET http://localhost:8000/
```

---

## Error Responses

All endpoints return standard HTTP status codes:

### Success Codes
- `200 OK`: Request successful
- `302 Found`: Redirect (for OAuth flows)

### Client Error Codes
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Not authenticated or session expired
- `404 Not Found`: Resource not found

### Server Error Codes
- `500 Internal Server Error`: Server error

### Error Format
```json
{
  "detail": "Error message here"
}
```

## CORS Configuration

The backend allows requests from the frontend URL specified in `FRONTEND_URL` environment variable.

**Allowed:**
- Origin: `FRONTEND_URL`
- Credentials: Yes
- Methods: All
- Headers: All

## Rate Limiting

Currently, there is no rate limiting. Consider adding rate limiting in production using:
- `slowapi` library
- Nginx rate limiting
- API Gateway rate limiting

## Testing with Postman/Insomnia

### Setup
1. Create a new request collection
2. Set base URL to `http://localhost:8000`
3. Enable "Send cookies" in settings

### Testing Protected Endpoints
1. First, login via browser: `http://localhost:8000/auth/login`
2. After login, copy the `session` cookie from browser DevTools
3. Add cookie to Postman/Insomnia requests
4. Make requests to protected endpoints

## Testing with cURL

### With session cookie
```bash
# Get session cookie from browser after login
SESSION_COOKIE="your-session-cookie-value"

# Make authenticated requests
curl -X GET http://localhost:8000/images \
  --cookie "session=$SESSION_COOKIE"
```

## Frontend Integration

### JavaScript/TypeScript
```typescript
// All requests must include credentials: 'include'
const response = await fetch('http://localhost:8000/images', {
  method: 'GET',
  credentials: 'include',  // IMPORTANT
});
```

### React
```tsx
import { useEffect, useState } from 'react';

function ImageList() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/images', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(setImages);
  }, []);

  return <div>{/* Render images */}</div>;
}
```

### Next.js
```typescript
// pages/api/proxy.ts - Optional proxy to avoid CORS
export default async function handler(req, res) {
  const response = await fetch('http://localhost:8000/images', {
    headers: {
      cookie: req.headers.cookie || '',
    },
  });
  
  const data = await response.json();
  res.json(data);
}
```

## WebSocket Support (Future)

Currently not implemented. For real-time features, consider:
- FastAPI WebSocket support
- Socket.io
- Server-Sent Events (SSE)

## GraphQL Support (Future)

Currently REST only. For GraphQL, consider:
- Strawberry GraphQL (integrates with FastAPI)
- GraphQL subscriptions for real-time

## Versioning

Current version: `v1.0.0`

Future versions may include:
- `/v2/` prefix for breaking changes
- API version in headers
- Deprecation warnings
