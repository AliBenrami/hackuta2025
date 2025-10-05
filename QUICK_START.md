# Quick Start Guide

Get up and running in 10 minutes.

## Prerequisites

- Python 3.10+
- Node.js 18+
- Auth0 account (free)
- AWS account (optional, for S3)

---

## 1. Clone Repository

```bash
git clone <repository-url>
cd hackuta2025
```

---

## 2. Setup Auth0

1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Sign up or login (free account works)
3. Create new application:
   - Type: **Regular Web Application**
   - Name: **HackUTA Dev**
4. Copy these values:
   - Domain (e.g., `dev-abc123.us.auth0.com`)
   - Client ID
   - Client Secret
5. Configure settings:
   - **Allowed Callback URLs**: `http://localhost:8000/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
6. Click "Save Changes"

---

## 3. Backend Setup

```bash
# Navigate to backend
cd hackuta-backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
SESSION_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
FRONTEND_URL=http://localhost:3000
DATABASE_URL=sqlite+aiosqlite:///./hackuta.db
EOF

# Edit .env and replace Auth0 values with yours
nano .env  # or use your favorite editor
```

---

## 4. Frontend Setup

```bash
# Open new terminal
cd hackuta-frontend

# Install dependencies
npm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

---

## 5. Run the Application

### Terminal 1: Backend
```bash
cd hackuta-backend
source venv/bin/activate  # macOS/Linux
# or: venv\Scripts\activate  # Windows

# Run backend (with auto-reload)
uvicorn app:app --reload --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Terminal 2: Frontend
```bash
cd hackuta-frontend

# Run frontend (with hot reload)
npm run dev
```

**Expected output:**
```
  ▲ Next.js 15.5.4
  - Local:        http://localhost:3000

 ✓ Starting...
 ✓ Ready in 2.1s
```

---

## 6. Test the Application

1. **Open browser**: http://localhost:3000
2. **Click "Login"**: Should redirect to Auth0
3. **Sign up or login**: Use any email/password
4. **Redirect back**: You should see your name and "Logout" button

**Success!** 🎉 Your application is running.

---

## 7. Test API (Optional)

### Swagger UI

Open http://localhost:8000/docs to see interactive API documentation.

### Test Endpoints

```bash
# Health check (no auth required)
curl http://localhost:8000/

# Get current user (after logging in via browser)
# 1. Login at http://localhost:8000/auth/login
# 2. Copy session cookie from browser DevTools
# 3. Use cookie in curl:
curl http://localhost:8000/auth/me --cookie "session=YOUR_COOKIE_HERE"
```

---

## Common Issues

### Issue: "Port 8000 already in use"

**Solution:**
```bash
# Find and kill process
lsof -i :8000
kill -9 <PID>
```

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Find and kill process
lsof -i :3000
kill -9 <PID>
```

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
# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Auth0 redirect URI mismatch"

**Solution:**
1. Go to Auth0 Dashboard → Applications → Your App
2. Check **Allowed Callback URLs** includes: `http://localhost:8000/auth/callback`
3. Check **Allowed Logout URLs** includes: `http://localhost:3000`
4. Save changes

### Issue: "CORS error"

**Solution:**
1. Check `FRONTEND_URL` in backend `.env` is `http://localhost:3000`
2. Restart backend server
3. Clear browser cache

---

## Project Structure

```
hackuta2025/
├── hackuta-backend/          # FastAPI backend
│   ├── app.py               # Main application
│   ├── oauth.py             # OAuth configuration
│   ├── session.py           # Session management
│   └── .env                 # Configuration (you create this)
│
└── hackuta-frontend/         # Next.js frontend
    ├── src/
    │   ├── app/             # Pages
    │   ├── components/      # React components
    │   └── lib/api.ts       # API client
    └── .env.local           # Configuration (you create this)
```

---

## Environment Files

### Backend `.env`
```bash
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
SESSION_SECRET=random-secret-key
FRONTEND_URL=http://localhost:3000
DATABASE_URL=sqlite+aiosqlite:///./hackuta.db
```

### Frontend `.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## What's Next?

### For Developers

1. Read [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for detailed development info
2. Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system
3. Read [AUTH_FLOW.md](./AUTH_FLOW.md) to understand authentication

### Add Features

- **Image Upload**: Already implemented in backend
- **Image Analysis**: Extend `analyze.py` with ML models
- **User Profiles**: Add more user fields
- **Sharing**: Add sharing functionality

### Deploy to Production

Read [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.

---

## API Endpoints

### Authentication
- `GET /auth/login` - Login
- `GET /auth/callback` - OAuth callback
- `GET /auth/logout` - Logout
- `GET /auth/me` - Get current user

### Images
- `GET /images` - List user's images
- `POST /images` - Create image record
- `GET /images/{id}` - Get specific image
- `POST /analyze/image` - Upload and analyze image

See [API_REFERENCE.md](./API_REFERENCE.md) for detailed documentation.

---

## How Authentication Works

1. User clicks "Login" → Redirects to backend
2. Backend redirects to Auth0
3. User authenticates on Auth0
4. Auth0 redirects back to backend
5. Backend creates session cookie
6. Backend redirects to frontend with cookie
7. All future requests include cookie automatically

**Simple!** No JWT tokens on frontend, no complex client-side auth logic.

See [AUTH_FLOW.md](./AUTH_FLOW.md) for detailed explanation.

---

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, Authlib
- **Frontend**: Next.js, React, TypeScript
- **Database**: SQLite (dev), PostgreSQL (prod)
- **Auth**: Auth0 OAuth2
- **Storage**: AWS S3 (optional)

---

## Stopping the Application

1. Press `Ctrl+C` in backend terminal
2. Press `Ctrl+C` in frontend terminal

---

## Need Help?

- Check [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for common issues
- Check [API_REFERENCE.md](./API_REFERENCE.md) for API details
- Check Auth0 logs in [Auth0 Dashboard](https://manage.auth0.com)

---

**Happy Hacking!** 🚀
