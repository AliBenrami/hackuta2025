# Full-Stack Image Management App with OAuth

This is a complete full-stack application with JWT authentication for image URL storage and management.

## Architecture

- **Backend**: FastAPI with JWT authentication (Auth0-style)
- **Frontend**: Next.js with NextAuth.js
- **Database**: PostgreSQL with SQLAlchemy
- **Authentication**: Auth0 OAuth provider

## Backend Setup

### 1. Install Dependencies

```bash
cd hackuta-backend
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in `hackuta-backend/`:

```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/hackuta_db

# Auth0 Configuration
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=https://your-api-identifier

# S3 Configuration
S3_BUCKET_NAME=your-s3-bucket-name
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb hackuta_db

# Run the application (tables will be created automatically)
python app.py
```

### 4. Start Backend

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd hackuta-frontend
npm install
```

### 2. Environment Variables

Create a `.env.local` file in `hackuta-frontend/`:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Auth0 Configuration
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
AUTH0_ISSUER=https://your-domain.auth0.com

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Start Frontend

```bash
npm run dev
```

## Auth0 Setup

1. Create an Auth0 application
2. Configure the application:

   - **Application Type**: Single Page Application
   - **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback/auth0`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`

3. Create an API in Auth0:

   - **Name**: Your API name
   - **Identifier**: `https://your-api-identifier`
   - **Signing Algorithm**: RS256

4. Update your environment variables with the Auth0 credentials

## API Endpoints

### Authentication Required

All endpoints except `/` require a valid JWT token in the Authorization header.

#### GET `/me`

Get current user information.

#### POST `/images`

Create a new image record with URL.

**Request Body:**

```json
{
  "url": "https://example.com/image.jpg",
  "filename": "optional-filename",
  "content_type": "image/jpeg",
  "analysis_text": "optional-analysis"
}
```

#### GET `/images`

Get all images for the current user.

#### GET `/images/{image_id}`

Get a specific image by ID.

#### POST `/analyze/image`

Upload and analyze an image file.

**Request:** Multipart form data with `image` field.

## Frontend Features

- **Authentication**: Sign in/out with Auth0
- **Image Management**: Add images by URL or upload files
- **Image Analysis**: Upload images for AI analysis
- **User Dashboard**: View all user's images
- **Responsive Design**: Works on desktop and mobile

## Security Features

- **JWT Validation**: RS256 signature verification
- **User Isolation**: Users can only access their own images
- **Token Refresh**: Automatic token refresh handling
- **CORS Protection**: Proper CORS configuration
- **Input Validation**: Pydantic models for request validation

## Database Schema

### Users Table

- `id`: Primary key
- `user_id`: OAuth sub claim (unique)
- `email`: User email
- `name`: User display name
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Images Table

- `id`: Primary key
- `url`: Image URL
- `filename`: Original filename
- `content_type`: MIME type
- `analysis_text`: AI analysis results
- `user_id`: Foreign key to users
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Development

### Backend Development

```bash
cd hackuta-backend
uvicorn app:app --reload
```

### Frontend Development

```bash
cd hackuta-frontend
npm run dev
```

### Database Migrations

The application automatically creates tables on startup. For production, consider using Alembic for migrations.

## Production Deployment

1. Set up a PostgreSQL database
2. Configure Auth0 for production domains
3. Set up S3 bucket for image storage
4. Deploy backend to your preferred platform (AWS, Heroku, etc.)
5. Deploy frontend to Vercel, Netlify, or similar
6. Update environment variables for production URLs

## Troubleshooting

### Common Issues

1. **JWT Verification Fails**: Check Auth0 domain and audience configuration
2. **Database Connection**: Verify DATABASE_URL format and credentials
3. **CORS Errors**: Ensure frontend URL is allowed in backend CORS settings
4. **Auth0 Redirect**: Check callback URLs in Auth0 dashboard

### Logs

Backend logs are available in the console. Frontend logs are in the browser console.
