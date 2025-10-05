# Development Guide

Complete guide for developers working on this project.

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Running the Application](#running-the-application)
3. [Development Workflow](#development-workflow)
4. [Code Structure](#code-structure)
5. [Adding Features](#adding-features)
6. [Testing](#testing)
7. [Debugging](#debugging)
8. [Common Issues](#common-issues)

---

## Initial Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn
- Auth0 account
- AWS account (for S3)

### 1. Clone Repository

```bash
git clone <repository-url>
cd hackuta2025
```

### 2. Backend Setup

```bash
cd hackuta-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and fill in your credentials

# Initialize database
python -c "from database import init_db; import asyncio; asyncio.run(init_db())"
```

### 3. Frontend Setup

```bash
cd hackuta-frontend

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
# Edit .env.local and set API URL
```

### 4. Auth0 Setup

1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Create a new Application (Regular Web Application)
3. Configure:
   - **Allowed Callback URLs**: `http://localhost:8000/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
4. Copy credentials to backend `.env`

### 5. AWS S3 Setup (Optional)

1. Create S3 bucket
2. Configure CORS on bucket:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": []
  }
]
```
3. Add credentials to backend `.env`

---

## Running the Application

### Development Mode

#### Terminal 1: Backend
```bash
cd hackuta-backend
source venv/bin/activate  # macOS/Linux
# or: venv\Scripts\activate  # Windows

# Run with auto-reload
uvicorn app:app --reload --port 8000

# Or using fastapi-cli
fastapi dev app.py
```

Backend will be available at: `http://localhost:8000`

#### Terminal 2: Frontend
```bash
cd hackuta-frontend

# Run development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

### Check Everything is Working

1. Open `http://localhost:3000`
2. Click "Login"
3. Authenticate with Auth0
4. You should be redirected back and see your name

---

## Development Workflow

### Making Changes

#### Backend Changes

1. Edit Python files in `hackuta-backend/`
2. Backend auto-reloads (if using `--reload` flag)
3. Test changes at `http://localhost:8000/docs` (Swagger UI)

#### Frontend Changes

1. Edit TypeScript/React files in `hackuta-frontend/src/`
2. Frontend auto-reloads (Next.js Fast Refresh)
3. Changes appear immediately in browser

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add feature: description"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

---

## Code Structure

### Backend Structure

```
hackuta-backend/
├── app.py              # Main FastAPI application
├── oauth.py            # OAuth configuration (Authlib)
├── session.py          # Session management (cookies)
├── database.py         # Database connection (SQLAlchemy)
├── models.py           # Database models (User, Image)
├── schemas.py          # Pydantic schemas (request/response)
├── util.py             # Utility functions (S3 upload, etc)
├── analyze.py          # Image analysis logic
├── auth.py             # Legacy JWT auth (kept for reference)
└── requirements.txt    # Python dependencies
```

### Frontend Structure

```
hackuta-frontend/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── page.tsx           # Home page
│   │   ├── layout.tsx         # Root layout
│   │   └── profile/
│   │       └── page.tsx       # Profile page
│   ├── components/            # React components
│   │   ├── LoginButton.tsx   # Login/logout button
│   │   └── ImageManager.tsx  # Image upload/display
│   ├── lib/
│   │   └── api.ts            # API client functions
│   └── middleware.ts          # Next.js middleware
├── public/                    # Static files
├── package.json              # Dependencies
└── next.config.ts            # Next.js configuration
```

---

## Adding Features

### Adding a Backend Endpoint

1. **Add schema** (`schemas.py`):
```python
class NewFeatureRequest(BaseModel):
    field1: str
    field2: int

class NewFeatureResponse(BaseModel):
    id: int
    result: str
```

2. **Add endpoint** (`app.py`):
```python
@app.post("/feature", response_model=NewFeatureResponse)
async def new_feature(
    request: Request,
    data: NewFeatureRequest,
    db: AsyncSession = Depends(get_db)
):
    # Get current user
    current_user = await get_current_user_from_session(request, db)
    
    # Your logic here
    result = process_feature(data)
    
    return {"id": 1, "result": result}
```

3. **Test in Swagger**: `http://localhost:8000/docs`

### Adding a Frontend Component

1. **Create component** (`src/components/NewComponent.tsx`):
```typescript
'use client';

import { useState } from 'react';

export default function NewComponent() {
  const [data, setData] = useState(null);

  return (
    <div>
      <h2>New Component</h2>
      {/* Your component code */}
    </div>
  );
}
```

2. **Add API function** (`src/lib/api.ts`):
```typescript
export async function getNewFeature(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/feature`, {
    credentials: 'include',
  });
  return response.json();
}
```

3. **Use in page** (`src/app/page.tsx`):
```typescript
import NewComponent from '@/components/NewComponent';

export default function Home() {
  return (
    <div>
      <NewComponent />
    </div>
  );
}
```

### Adding Database Models

1. **Add model** (`models.py`):
```python
class NewModel(Base):
    __tablename__ = "new_models"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="new_models")
```

2. **Update User model** (`models.py`):
```python
class User(Base):
    # ... existing fields ...
    
    # Add relationship
    new_models = relationship("NewModel", back_populates="user")
```

3. **Recreate database**:
```bash
rm hackuta.db
python -c "from database import init_db; import asyncio; asyncio.run(init_db())"
```

---

## Testing

### Backend Testing

#### Manual Testing with Swagger
1. Open `http://localhost:8000/docs`
2. Click "Authorize" and add session cookie
3. Test endpoints interactively

#### Manual Testing with cURL
```bash
# Login first in browser to get session cookie
SESSION="your-session-cookie"

# Test endpoint
curl -X GET http://localhost:8000/images \
  --cookie "session=$SESSION"
```

#### Unit Testing (Future)
```bash
# Install pytest
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/
```

### Frontend Testing

#### Manual Testing
1. Open `http://localhost:3000`
2. Test user flows manually
3. Check browser console for errors

#### Component Testing (Future)
```bash
# Install testing libraries
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Run tests
npm test
```

---

## Debugging

### Backend Debugging

#### FastAPI Debug Mode
Already enabled with `--reload` flag.

#### Python Debugger (pdb)
```python
import pdb; pdb.set_trace()  # Add this line where you want to break
```

#### Print Debugging
```python
print(f"Debug: user_id = {user_id}")
```

#### Logging
```python
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

logger.debug("Debug message")
logger.info("Info message")
logger.error("Error message")
```

### Frontend Debugging

#### Browser DevTools
- F12 to open DevTools
- Console tab for logs
- Network tab for API calls
- Application tab for cookies

#### React DevTools
1. Install extension: [React DevTools](https://react.dev/learn/react-developer-tools)
2. Inspect component state and props

#### Console Logging
```typescript
console.log('Debug:', data);
console.error('Error:', error);
console.table(users);  // Nice table format
```

### Debugging Auth Issues

#### Check Session Cookie
1. Open DevTools → Application → Cookies
2. Look for `session` cookie
3. Check expiry and value

#### Check Auth Flow
```python
# In oauth.py, add logging
print(f"Token: {token}")
print(f"User info: {user_info}")
```

#### Common Auth Issues
- Cookie not being sent: Check `credentials: 'include'`
- Redirect URI mismatch: Check Auth0 settings
- Session expired: Check `SESSION_MAX_AGE`

---

## Common Issues

### Issue: "Module not found" (Backend)

**Solution:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: "Module not found" (Frontend)

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port already in use

**Solution:**
```bash
# Backend (port 8000)
lsof -i :8000
kill -9 <PID>

# Frontend (port 3000)
lsof -i :3000
kill -9 <PID>
```

### Issue: Database locked

**Solution:**
```bash
# Close all connections and restart
rm hackuta.db
python -c "from database import init_db; import asyncio; asyncio.run(init_db())"
```

### Issue: CORS errors

**Solution:**
1. Check `FRONTEND_URL` in backend `.env`
2. Ensure `credentials: 'include'` in frontend fetch calls
3. Check CORS middleware configuration

### Issue: Auth0 callback error

**Solution:**
1. Check callback URL in Auth0 dashboard
2. Verify `AUTH0_DOMAIN`, `CLIENT_ID`, `CLIENT_SECRET`
3. Check Auth0 logs in dashboard

---

## Code Style

### Python (Backend)
- Follow PEP 8
- Use type hints
- Document functions with docstrings

```python
async def get_user(user_id: int, db: AsyncSession) -> User:
    """
    Get user by ID from database.
    
    Args:
        user_id: The user's ID
        db: Database session
        
    Returns:
        User object
        
    Raises:
        HTTPException: If user not found
    """
    # Implementation
```

### TypeScript (Frontend)
- Use TypeScript types
- Use functional components
- Use hooks for state management

```typescript
interface UserProps {
  userId: string;
  name: string;
}

export default function UserComponent({ userId, name }: UserProps) {
  const [loading, setLoading] = useState(false);
  
  // Implementation
}
```

---

## Performance Tips

### Backend
- Use `async/await` for all I/O operations
- Use database indexes on frequently queried fields
- Cache expensive computations
- Use connection pooling for database

### Frontend
- Use Next.js Image component for images
- Lazy load components with `React.lazy()`
- Use `useMemo` and `useCallback` for expensive computations
- Implement pagination for large lists

---

## Helpful Commands

### Backend
```bash
# Format code
black app.py

# Check types
mypy app.py

# Generate requirements
pip freeze > requirements.txt

# Database shell
python -c "from database import get_db; import asyncio; # ..."
```

### Frontend
```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Format
npx prettier --write src/

# Build for production
npm run build
```

---

## Next Steps

1. Read [API_REFERENCE.md](./API_REFERENCE.md) for API details
2. Read [AUTH_FLOW.md](./AUTH_FLOW.md) for authentication
3. Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
4. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design

Happy coding! 🚀
