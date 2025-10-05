# Architecture Overview

## System Design

This application follows a **simple client-server architecture** with backend-controlled authentication.

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│                 │         │                  │         │              │
│  Next.js        │ ◄─────► │  FastAPI         │ ◄─────► │   SQLite     │
│  Frontend       │  HTTP   │  Backend         │         │   Database   │
│                 │         │                  │         │              │
└─────────────────┘         └──────────────────┘         └──────────────┘
       │                            │
       │                            │
       │                            ▼
       │                    ┌──────────────┐
       └───────────────────►│              │
            Redirects       │   Auth0      │
                           │   (OAuth)    │
                           │              │
                           └──────────────┘
```

## Components

### 1. Frontend (Next.js)
- **Purpose**: User interface and client-side rendering
- **Location**: `/hackuta-frontend`
- **Key Features**:
  - Simple React components
  - No client-side authentication logic
  - Uses session cookies for authentication
  - Redirects to backend for login/logout

### 2. Backend (FastAPI)
- **Purpose**: API server and authentication controller
- **Location**: `/hackuta-backend`
- **Key Features**:
  - Handles OAuth flow with Auth0
  - Session management with signed cookies
  - User and image management
  - Image analysis and S3 integration

### 3. Database (SQLite)
- **Purpose**: Data persistence
- **Type**: SQLite with async support (aiosqlite)
- **Tables**:
  - `users`: User accounts
  - `images`: User uploaded images with analysis

### 4. Authentication (Auth0)
- **Purpose**: OAuth identity provider
- **Flow**: Backend-controlled OAuth2 flow
- **Session**: Cookie-based sessions (no JWT on frontend)

## Key Design Decisions

### 1. Backend-Controlled Authentication
**Why?** 
- Simpler frontend code
- More secure (credentials never touch client)
- Easier to maintain
- Better for server-side rendering

### 2. Session Cookies vs JWT Tokens
**Why Cookies?**
- Automatic sending with requests
- HttpOnly flag prevents XSS attacks
- Simpler client-side code
- Backend controls session lifecycle

### 3. Direct Backend Integration
**Why?**
- No need for NextAuth.js middleware
- Direct control over OAuth flow
- Reduced complexity
- Fewer dependencies

## Data Flow

### Authentication Flow
1. User clicks "Login" on frontend
2. Browser redirects to backend `/auth/login`
3. Backend initiates OAuth with Auth0
4. User authenticates on Auth0
5. Auth0 redirects to backend `/auth/callback`
6. Backend creates/updates user in database
7. Backend creates signed session cookie
8. Backend redirects to frontend with cookie
9. Frontend automatically authenticated via cookie

### Image Upload Flow
1. User selects image file
2. Frontend sends multipart/form-data to backend
3. Backend verifies session cookie
4. Backend uploads to S3
5. Backend analyzes image (future: ML models)
6. Backend saves metadata to database
7. Backend returns image data to frontend

## Security Features

1. **HttpOnly Cookies**: Prevents XSS attacks
2. **Signed Sessions**: Uses itsdangerous for tamper-proof cookies
3. **CORS Configuration**: Restricts frontend origins
4. **Session Expiry**: 7-day automatic expiration
5. **Secure Flag**: HTTPS-only in production

## Scalability Considerations

### Current Setup (Development)
- SQLite database
- Session cookies
- Single server

### Production Ready Changes
1. **Database**: Migrate to PostgreSQL
2. **Sessions**: Use Redis for session storage
3. **Static Files**: Use CDN for frontend
4. **API**: Add rate limiting
5. **Auth**: Consider refresh token rotation

## File Structure

```
hackuta2025/
├── hackuta-backend/
│   ├── app.py              # Main FastAPI application
│   ├── auth.py             # Legacy JWT verification (kept for reference)
│   ├── oauth.py            # OAuth client configuration
│   ├── session.py          # Session management
│   ├── database.py         # Database connection
│   ├── models.py           # SQLAlchemy models
│   ├── schemas.py          # Pydantic schemas
│   ├── util.py             # Utility functions (S3, etc)
│   ├── analyze.py          # Image analysis
│   └── requirements.txt    # Python dependencies
│
└── hackuta-frontend/
    ├── src/
    │   ├── app/            # Next.js pages
    │   ├── components/     # React components
    │   ├── lib/
    │   │   └── api.ts      # Simple API client
    │   └── middleware.ts   # Next.js middleware
    ├── package.json        # Node dependencies
    └── next.config.ts      # Next.js configuration
```

## API Design

All API endpoints follow RESTful principles:

- `GET /auth/login` - Initiate login
- `GET /auth/callback` - OAuth callback
- `GET /auth/logout` - Logout user
- `GET /auth/me` - Get current user
- `GET /images` - List user's images
- `POST /images` - Create image record
- `GET /images/{id}` - Get specific image
- `POST /analyze/image` - Upload and analyze image

See [API_REFERENCE.md](./API_REFERENCE.md) for detailed documentation.
