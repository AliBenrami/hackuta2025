# Quick Reference Card

One-page reference for common commands and configurations.

---

## Start/Stop

### Start Everything

**Terminal 1 (Backend):**

```bash
cd hackuta-backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app:app --reload --port 8000
```

**Terminal 2 (Frontend):**

```bash
cd hackuta-frontend
npm run dev
```

**Access:** http://localhost:3000

### Stop

Press `Ctrl+C` in each terminal

---

## First Time Setup

```bash
# Backend
cd hackuta-backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Create .env file (see below)
python3 -c "from database import init_db; import asyncio; asyncio.run(init_db())"

# Frontend
cd hackuta-frontend
npm install
# Create .env.local file (see below)
```

---

## Environment Files

### Backend: `hackuta-backend/.env`

```bash
AUTH0_DOMAIN=dev-xxxxx.us.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
SESSION_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
FRONTEND_URL=http://localhost:3000
DATABASE_URL=sqlite+aiosqlite:///./hackuta.db
ENVIRONMENT=development
```

### Frontend: `hackuta-frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Auth0 Configuration

**Application Type:** Regular Web Application

**Settings:**

| Field                 | Value                                 |
| --------------------- | ------------------------------------- |
| Allowed Callback URLs | `http://localhost:8000/auth/callback` |
| Allowed Web Origins   | `http://localhost:3000`               |

---

## API Endpoints

**Base URL:** http://localhost:8000

### Auth

- `GET /auth/login` - Login
- `GET /auth/callback` - OAuth callback
- `GET /auth/logout` - Logout
- `GET /auth/me` - Current user

### Images

- `GET /images` - List images
- `POST /images` - Create image
- `GET /images/{id}` - Get image
- `POST /analyze/image` - Upload & analyze

**API Docs:** http://localhost:8000/docs

---

## Common Issues

### Port in use

```bash
# Kill process on port 8000
lsof -i :8000
kill -9 <PID>

# Kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

### Module not found (Backend)

```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Module not found (Frontend)

```bash
rm -rf node_modules package-lock.json
npm install
```

### Auth not working

1. Check `.env` has correct Auth0 values
2. Check Auth0 callback URL configured
3. Clear localStorage: `localStorage.clear()`

### Session not persisting

```javascript
// Check token exists
localStorage.getItem("session_token");

// Clear if needed
localStorage.clear();
```

---

## Useful Commands

### Backend

```bash
# Generate secret
python3 -c "import secrets; print(secrets.token_hex(32))"

# Reset database
rm hackuta.db
python3 -c "from database import init_db; import asyncio; asyncio.run(init_db())"

# Run tests
pytest

# Format code
black app.py
```

### Frontend

```bash
# Development
npm run dev

# Build production
npm run build

# Start production
npm start

# Lint
npm run lint
```

### Browser Console

```javascript
// Check auth token
localStorage.getItem("session_token");

// Clear session
localStorage.clear();

// Check cookies
document.cookie;
```

---

## File Structure

```
hackuta2025/
├── hackuta-backend/
│   ├── app.py              # Main app
│   ├── oauth.py            # OAuth config
│   ├── session.py          # Sessions
│   ├── .env                # Config (create this)
│   └── hackuta.db          # Database
│
└── hackuta-frontend/
    ├── src/app/page.tsx    # Landing page
    ├── src/lib/api.ts      # API client
    └── .env.local          # Config (create this)
```

---

## Ports

| Service  | Port | URL                        |
| -------- | ---- | -------------------------- |
| Frontend | 3000 | http://localhost:3000      |
| Backend  | 8000 | http://localhost:8000      |
| API Docs | 8000 | http://localhost:8000/docs |

---

## Status Check

```bash
# Backend running?
curl http://localhost:8000/

# Frontend running?
curl http://localhost:3000/

# Auth working?
curl http://localhost:8000/auth/me
```

---

## Links

- 📖 [Setup Guide](./SETUP_GUIDE.md)
- 🏗️ [Architecture](./ARCHITECTURE.md)
- 📡 [API Reference](./API_REFERENCE.md)
- 🐛 [Troubleshooting](./TROUBLESHOOTING.md)

---

**Save this page for quick reference!** 📌
