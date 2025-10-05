# Adsett - Complete Setup Guide

Step-by-step guide to get Adsett running from scratch.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Auth0 Setup](#auth0-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Running the Application](#running-the-application)
6. [Testing Authentication](#testing-authentication)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.10+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/downloads)

### Verify Installations

```bash
python3 --version  # Should show 3.10 or higher
node --version     # Should show 18 or higher
npm --version      # Should show 8 or higher
```

---

## Auth0 Setup

### 1. Create Auth0 Account

1. Go to [Auth0](https://auth0.com)
2. Click **Sign Up** (it's free)
3. Complete the registration process

### 2. Create Application

1. In Auth0 Dashboard, click **Applications** → **Applications**
2. Click **Create Application**
3. Name it: `Adsett Dev`
4. Choose: **Regular Web Application**
5. Click **Create**

### 3. Configure Application Settings

In your new application's settings:

#### Application URIs

**Allowed Callback URLs:**

```
http://localhost:8000/auth/callback
```

**Allowed Web Origins:**

```
http://localhost:3000
```

Click **Save Changes** at the bottom.

### 4. Copy Credentials

You'll need these values later. Keep this tab open or copy them now:

- **Domain** (looks like: `dev-abc123xyz.us.auth0.com`)
- **Client ID** (looks like: `abcdefghijklmnopqrstuvwxyz123456`)
- **Client Secret** (looks like: a long string of random characters)

---

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd hackuta-backend
```

### 2. Create Virtual Environment

**macOS/Linux:**

```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows:**

```bash
python -m venv venv
venv\Scripts\activate
```

You should see `(venv)` in your terminal prompt.

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

This will take a minute or two.

### 4. Create Environment File

Create a file named `.env` in the `hackuta-backend` directory:

```bash
# On macOS/Linux
touch .env

# On Windows
type nul > .env
```

### 5. Configure Environment Variables

Open `.env` in your text editor and add:

```bash
# Auth0 Configuration
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Session Secret (generate a random string)
SESSION_SECRET=your-random-secret-key-here

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Database (SQLite for development)
DATABASE_URL=sqlite+aiosqlite:///./hackuta.db

# Environment
ENVIRONMENT=development
```

**Replace the Auth0 values** with your actual credentials from step 4 of Auth0 setup.

**Generate SESSION_SECRET:**

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output and paste it as the `SESSION_SECRET` value.

### 6. Initialize Database

```bash
python3 -c "from database import init_db; import asyncio; asyncio.run(init_db())"
```

You should see no errors. A file named `hackuta.db` will be created.

### 7. Verify Backend Setup

Test that the backend can start:

```bash
uvicorn app:app --reload --port 8000
```

You should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Application startup complete.
```

Press `Ctrl+C` to stop (we'll start it properly later).

---

## Frontend Setup

### 1. Open New Terminal

Keep the backend terminal open, and open a **new terminal window**.

### 2. Navigate to Frontend Directory

```bash
cd hackuta-frontend
```

### 3. Install Dependencies

```bash
npm install
```

This will take a few minutes. Don't worry about warnings.

### 4. Create Environment File

Create a file named `.env.local` in the `hackuta-frontend` directory:

```bash
# On macOS/Linux
touch .env.local

# On Windows
type nul > .env.local
```

### 5. Configure Environment Variables

Open `.env.local` and add:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 6. Verify Frontend Setup

Test that the frontend can start:

```bash
npm run dev
```

You should see:

```
  ▲ Next.js 15.5.4
  - Local:        http://localhost:3000

 ✓ Starting...
 ✓ Ready in 2.3s
```

Press `Ctrl+C` to stop (we'll start it properly next).

---

## Running the Application

### Start Backend (Terminal 1)

```bash
cd hackuta-backend
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate      # Windows

uvicorn app:app --reload --port 8000
```

**Leave this running.**

### Start Frontend (Terminal 2)

Open a new terminal window:

```bash
cd hackuta-frontend
npm run dev
```

**Leave this running.**

### Access the Application

Open your browser and go to:

```
http://localhost:3000
```

You should see the Adsett landing page! 🎉

---

## Testing Authentication

### 1. Click "Log In"

On the landing page, click the **"Log In"** button in the header.

### 2. Authenticate with Auth0

You'll be redirected to Auth0. You can:

- **Sign up** with email/password
- **Or use Google** (if enabled in Auth0)

### 3. Grant Permissions

Auth0 may ask you to authorize the application. Click **Accept**.

### 4. Redirect Back

You should be redirected back to:

```
http://localhost:3000/auth/callback
```

Then immediately to:

```
http://localhost:3000/dashboard
```

### 5. Verify Login

You should see:

- Your name or email in the header
- A "Sign Out" button
- The dashboard page

### 6. Test Persistence

**Refresh the page** (F5 or Cmd+R). You should **stay logged in**!

### 7. Test Logout

Click **"Sign Out"**. You should be logged out and redirected to the home page.

---

## Project Structure

```
hackuta2025/
├── hackuta-backend/          # Python FastAPI backend
│   ├── app.py               # Main application
│   ├── oauth.py             # OAuth configuration
│   ├── session.py           # Session management
│   ├── database.py          # Database setup
│   ├── models.py            # Database models
│   ├── schemas.py           # Pydantic schemas
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Environment variables (YOU CREATE THIS)
│   └── hackuta.db           # SQLite database (created automatically)
│
├── hackuta-frontend/         # Next.js frontend
│   ├── src/
│   │   ├── app/             # Next.js pages
│   │   │   ├── page.tsx     # Landing page
│   │   │   ├── auth/
│   │   │   │   └── callback/
│   │   │   │       └── page.tsx  # OAuth callback handler
│   │   │   └── api/
│   │   │       └── auth/
│   │   │           └── session/
│   │   │               └── route.ts  # Session API
│   │   ├── components/      # React components
│   │   │   ├── Header.tsx
│   │   │   └── ScrollHint.tsx
│   │   └── lib/
│   │       └── api.ts       # API client
│   ├── package.json         # Node dependencies
│   └── .env.local           # Environment variables (YOU CREATE THIS)
│
└── SETUP_GUIDE.md           # This file!
```

---

## How Authentication Works

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. Click "Login"
       ↓
┌─────────────────┐
│  Frontend       │
│  localhost:3000 │
└──────┬──────────┘
       │ 2. Redirect to backend
       ↓
┌─────────────────┐
│  Backend        │
│  localhost:8000 │
└──────┬──────────┘
       │ 3. Redirect to Auth0
       ↓
┌─────────────────┐
│     Auth0       │
│  (Cloud)        │
└──────┬──────────┘
       │ 4. User authenticates
       │ 5. Redirect to backend
       ↓
┌─────────────────┐
│  Backend        │
│  localhost:8000 │
└──────┬──────────┘
       │ 6. Create session token
       │ 7. Redirect to /auth/callback?token=...
       ↓
┌─────────────────┐
│  Frontend       │
│  /auth/callback │
└──────┬──────────┘
       │ 8. Store token in localStorage
       │ 9. Set session cookie
       │ 10. Redirect to /dashboard
       ↓
┌─────────────────┐
│  Dashboard      │
│  (Logged in!)   │
└─────────────────┘
```

**Key Points:**

- Token stored in **localStorage** (survives refresh)
- Also stored in **httpOnly cookie** (more secure)
- All API calls include token in `Authorization: Bearer <token>` header

---

## Troubleshooting

### Backend won't start

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**

```bash
# Make sure virtual environment is activated
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate      # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

---

### Frontend won't start

**Error:** `Module not found: Can't resolve 'react'`

**Solution:**

```bash
# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

### "Port 8000 already in use"

**Solution:**

```bash
# Find and kill the process
lsof -i :8000
kill -9 <PID>

# Or use a different port
uvicorn app:app --reload --port 8001
# Then update NEXT_PUBLIC_API_URL in frontend .env.local
```

---

### "Port 3000 already in use"

**Solution:**

```bash
# Find and kill the process
lsof -i :3000
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

---

### Auth0 "Callback URL mismatch" error

**Solution:**

1. Go to Auth0 Dashboard
2. Applications → Your App → Settings
3. Check **Allowed Callback URLs** includes: `http://localhost:8000/auth/callback`
4. Check **Allowed Web Origins** includes: `http://localhost:3000`
5. Click **Save Changes**

---

### "Not authenticated" errors

**Solution:**

1. Open browser DevTools (F12)
2. Go to Application → Local Storage → `http://localhost:3000`
3. Check if `session_token` exists
4. If not, try logging in again
5. If still failing, clear all storage and cookies for localhost

---

### Login works but doesn't persist on refresh

**Solution:**

Check browser console (F12 → Console) for errors. Common causes:

- Token not being saved to localStorage
- Cookie settings blocking storage

Try in **Incognito/Private mode** to rule out extensions.

---

### Backend logs show "DEBUG /auth/me - No valid auth header"

**Solution:**

This means the frontend isn't sending the token. Check:

1. Token is in localStorage:

   ```javascript
   // In browser console
   localStorage.getItem("session_token");
   ```

2. If null, log in again
3. If exists but still failing, check browser console for network errors

---

## Environment Variables Reference

### Backend (.env)

| Variable              | Description                      | Example                            |
| --------------------- | -------------------------------- | ---------------------------------- |
| `AUTH0_DOMAIN`        | Your Auth0 domain                | `dev-abc123.us.auth0.com`          |
| `AUTH0_CLIENT_ID`     | Auth0 application client ID      | `abcd1234...`                      |
| `AUTH0_CLIENT_SECRET` | Auth0 application client secret  | `secret123...`                     |
| `SESSION_SECRET`      | Random string for signing tokens | Generate with Python               |
| `FRONTEND_URL`        | Frontend URL                     | `http://localhost:3000`            |
| `DATABASE_URL`        | Database connection string       | `sqlite+aiosqlite:///./hackuta.db` |
| `ENVIRONMENT`         | Environment name                 | `development`                      |

### Frontend (.env.local)

| Variable              | Description     | Example                 |
| --------------------- | --------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

**Note:** `NEXT_PUBLIC_` prefix makes variables available in the browser.

---

## Common Commands

### Backend

```bash
# Activate virtual environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate      # Windows

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app:app --reload --port 8000

# Run server with custom host
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# Initialize database
python3 -c "from database import init_db; import asyncio; asyncio.run(init_db())"

# Generate secret key
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Frontend

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run on custom port
PORT=3001 npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

## Next Steps

Now that your setup is complete:

1. **Explore the Dashboard** - Visit `/dashboard` (you'll need to create this page)
2. **Read the API docs** - Open `http://localhost:8000/docs` for Swagger UI
3. **Check the architecture** - Read `ARCHITECTURE.md` to understand the system
4. **Start building** - Add features to the dashboard!

---

## Getting Help

If you're stuck:

1. Check **Troubleshooting** section above
2. Read **TROUBLESHOOTING.md** for detailed solutions
3. Check browser console (F12) for errors
4. Check backend terminal for error messages
5. Verify all environment variables are set correctly

---

## Success Checklist

- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed
- [ ] Auth0 account created
- [ ] Auth0 application configured
- [ ] Backend `.env` file created with all variables
- [ ] Frontend `.env.local` file created
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend server runs on port 8000
- [ ] Frontend server runs on port 3000
- [ ] Can access http://localhost:3000
- [ ] Login works and redirects to Auth0
- [ ] After Auth0 login, redirected back to app
- [ ] User stays logged in after refresh
- [ ] Logout works correctly

If all checked ✅ - **You're ready to build!** 🚀

---

**Last Updated:** October 2025  
**Built at:** HackUTA 2025
