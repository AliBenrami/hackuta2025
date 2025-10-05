# Troubleshooting Guide

Common issues and their solutions.

## Table of Contents

1. [Backend Issues](#backend-issues)
2. [Frontend Issues](#frontend-issues)
3. [Authentication Issues](#authentication-issues)
4. [Database Issues](#database-issues)
5. [CORS Issues](#cors-issues)
6. [Deployment Issues](#deployment-issues)

---

## Backend Issues

### "Module not found" Error

**Symptoms:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # macOS/Linux
# or: venv\Scripts\activate  # Windows

# Verify activation (should show venv path)
which python

# Reinstall dependencies
pip install -r requirements.txt
```

---

### "Port 8000 already in use"

**Symptoms:**
```
ERROR: [Errno 48] Address already in use
```

**Solution:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or kill all Python processes (careful!)
pkill -f uvicorn
```

**Alternative:** Use a different port
```bash
uvicorn app:app --reload --port 8001
# Update NEXT_PUBLIC_API_URL in frontend
```

---

### "Could not import module 'app'"

**Symptoms:**
```
ERROR: Could not import module "app"
```

**Solution:**
```bash
# Make sure you're in the correct directory
cd hackuta-backend

# Verify app.py exists
ls -la app.py

# Check for syntax errors
python3 -c "import app"

# Run with correct module path
uvicorn app:app --reload
```

---

### Database Locked Error

**Symptoms:**
```
sqlite3.OperationalError: database is locked
```

**Solution:**
```bash
# Option 1: Close all connections and restart
# Stop backend, then:
rm hackuta.db
python3 -c "from database import init_db; import asyncio; asyncio.run(init_db())"

# Option 2: Increase timeout
# In database.py:
engine = create_async_engine(
    DATABASE_URL,
    connect_args={"timeout": 30}
)
```

---

### "Failed to get JWKS"

**Symptoms:**
```
ERROR: Failed to fetch JWKS from Auth0
```

**Solution:**
1. Check `AUTH0_DOMAIN` in `.env` is correct
2. Verify internet connection
3. Check Auth0 status: https://status.auth0.com
4. Verify domain format: `your-domain.auth0.com` (no https://)

---

## Frontend Issues

### "Module not found" Error

**Symptoms:**
```
Module not found: Can't resolve 'react'
```

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# If still failing, clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

### "Port 3000 already in use"

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

---

### "fetch is not defined" (Server-Side)

**Symptoms:**
```
ReferenceError: fetch is not defined
```

**Solution:**
This shouldn't happen in Next.js 15+, but if it does:

```bash
# Install node-fetch
npm install node-fetch

# Use in code
import fetch from 'node-fetch';
```

---

### Environment Variable Not Working

**Symptoms:**
```
process.env.NEXT_PUBLIC_API_URL is undefined
```

**Solution:**
1. Ensure variable starts with `NEXT_PUBLIC_`
2. File is named exactly `.env.local` (not `.env.local.txt`)
3. Restart development server after changing .env.local
```bash
# Stop server (Ctrl+C) and restart
npm run dev
```
4. Check you're accessing it correctly:
```typescript
// Correct
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Wrong (server-side only variables need different approach)
const secret = process.env.SECRET_KEY;
```

---

## Authentication Issues

### Login Redirects to Error Page

**Symptoms:**
User clicks login, goes to Auth0, then redirects to error page.

**Solution:**

1. **Check Auth0 Callback URL**
   - Go to Auth0 Dashboard → Applications → Your App
   - **Allowed Callback URLs** must include: `http://localhost:8000/auth/callback`
   - Save changes

2. **Check Backend is Running**
   ```bash
   curl http://localhost:8000/
   # Should return: {"message": "Hello World..."}
   ```

3. **Check Backend Logs**
   Look for errors in the terminal running backend.

4. **Check Auth0 Logs**
   - Go to Auth0 Dashboard → Monitoring → Logs
   - Look for failed login attempts

5. **Verify Environment Variables**
   ```bash
   # In hackuta-backend directory
   cat .env | grep AUTH0
   # Should show AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET
   ```

---

### Session Cookie Not Being Set

**Symptoms:**
User logs in successfully but `/auth/me` returns null.

**Solution:**

1. **Check Cookie in Browser**
   - Open DevTools → Application → Cookies
   - Look for `session` cookie for `localhost:3000` or `localhost:8000`
   - If missing, backend isn't setting cookie

2. **Check CORS Configuration**
   ```python
   # In app.py, verify:
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[FRONTEND_URL],  # Should be http://localhost:3000
       allow_credentials=True,         # Must be True!
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

3. **Check Frontend Fetch Calls**
   ```typescript
   // Must include credentials: 'include'
   fetch('http://localhost:8000/auth/me', {
       credentials: 'include',  // Required!
   });
   ```

4. **Check Session Secret**
   ```bash
   # In .env, make sure SESSION_SECRET is set
   echo $SESSION_SECRET  # Should output something
   ```

---

### "Invalid token" or "Unauthorized" Errors

**Symptoms:**
```
401 Unauthorized: Invalid token
```

**Solution:**

1. **Session Expired**
   - Sessions expire after 7 days by default
   - Login again

2. **Session Cookie Deleted**
   - Check if cookie exists in DevTools
   - Login again

3. **Wrong Environment**
   - Check `SESSION_SECRET` hasn't changed
   - If changed, all users must re-login

---

### Infinite Redirect Loop

**Symptoms:**
Browser keeps redirecting between frontend and backend.

**Solution:**

1. **Check FRONTEND_URL**
   ```bash
   # In backend .env
   FRONTEND_URL=http://localhost:3000  # No trailing slash!
   ```

2. **Check Auth0 Logout URL**
   - Auth0 Dashboard → Applications → Your App
   - **Allowed Logout URLs**: `http://localhost:3000`

3. **Clear Browser Cache and Cookies**
   - Completely close browser
   - Clear all cookies for localhost
   - Try again

---

## Database Issues

### "Database is locked"

**Solution:**
See [Backend Issues](#database-locked-error) above.

---

### "No such table: users"

**Symptoms:**
```
sqlite3.OperationalError: no such table: users
```

**Solution:**
```bash
# Initialize database
cd hackuta-backend
python3 -c "from database import init_db; import asyncio; asyncio.run(init_db())"

# Verify tables created
sqlite3 hackuta.db ".tables"
# Should show: users  images
```

---

### Cannot Connect to PostgreSQL

**Symptoms:**
```
psycopg2.OperationalError: could not connect to server
```

**Solution:**

1. **Check DATABASE_URL**
   ```bash
   # Format: postgresql+asyncpg://user:password@host:port/database
   echo $DATABASE_URL
   ```

2. **Verify PostgreSQL is Running**
   ```bash
   # Check status
   sudo systemctl status postgresql

   # Start if not running
   sudo systemctl start postgresql
   ```

3. **Check Network/Firewall**
   ```bash
   # Test connection
   psql -U username -h hostname -d database
   ```

4. **Install asyncpg**
   ```bash
   pip install asyncpg
   ```

---

## CORS Issues

### "CORS policy: No 'Access-Control-Allow-Origin' header"

**Symptoms:**
```
Access to fetch at 'http://localhost:8000/images' from origin 'http://localhost:3000' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Solution:**

1. **Check Backend CORS Middleware**
   ```python
   # In app.py
   from fastapi.middleware.cors import CORSMiddleware

   FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[FRONTEND_URL],  # Must match frontend URL exactly
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. **Check FRONTEND_URL Environment Variable**
   ```bash
   # In backend .env
   FRONTEND_URL=http://localhost:3000  # Must match exactly!
   ```

3. **Restart Backend**
   After changing CORS configuration, restart backend server.

4. **Check Frontend Fetch Calls**
   ```typescript
   fetch('http://localhost:8000/api', {
       credentials: 'include',  // Required for cookies
   });
   ```

---

### "CORS policy: credentials mode is 'include'"

**Symptoms:**
```
Access to fetch has been blocked by CORS policy: The value of the 
'Access-Control-Allow-Credentials' header in the response is '' which must be 'true'
```

**Solution:**
```python
# In app.py, ensure:
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,  # Must be True!
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Deployment Issues

### "502 Bad Gateway"

**Symptoms:**
Nginx returns 502 error.

**Solution:**

1. **Check Backend is Running**
   ```bash
   sudo systemctl status hackuta-api
   # Should show "active (running)"
   
   # If not running:
   sudo systemctl start hackuta-api
   ```

2. **Check Backend Logs**
   ```bash
   sudo journalctl -u hackuta-api -f
   ```

3. **Check Port Configuration**
   ```nginx
   # In nginx config, verify:
   proxy_pass http://127.0.0.1:8000;  # Must match backend port
   ```

4. **Check Firewall**
   ```bash
   # Allow port 8000
   sudo ufw allow 8000
   ```

---

### "SSL Certificate Error"

**Symptoms:**
```
NET::ERR_CERT_AUTHORITY_INVALID
```

**Solution:**

1. **Renew Certificate**
   ```bash
   sudo certbot renew
   sudo systemctl reload nginx
   ```

2. **Check Certificate**
   ```bash
   sudo certbot certificates
   ```

3. **Reinstall Certificate**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

---

### Environment Variables Not Loading

**Symptoms:**
Variables work locally but not in production.

**Solution:**

**Heroku:**
```bash
heroku config:set VARIABLE_NAME=value
```

**AWS EC2:**
```bash
# Add to systemd service file
[Service]
Environment="VARIABLE_NAME=value"

# Or use .env file
ExecStart=/bin/bash -c 'source .env && uvicorn app:app'
```

**Vercel:**
- Go to Project Settings → Environment Variables
- Add variables
- Redeploy

---

## General Debugging Tips

### Enable Debug Logging

**Backend:**
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Frontend:**
```typescript
console.log('Debug info:', data);
```

---

### Check All Services Are Running

```bash
# Backend
curl http://localhost:8000/
# Should return JSON

# Frontend
curl http://localhost:3000/
# Should return HTML

# Auth0
ping your-domain.auth0.com
# Should respond
```

---

### Clear Everything and Start Fresh

**Backend:**
```bash
cd hackuta-backend

# Deactivate venv
deactivate

# Delete venv and database
rm -rf venv hackuta.db

# Recreate
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Initialize database
python3 -c "from database import init_db; import asyncio; asyncio.run(init_db())"

# Start
uvicorn app:app --reload
```

**Frontend:**
```bash
cd hackuta-frontend

# Delete everything
rm -rf node_modules .next package-lock.json

# Reinstall
npm install

# Start
npm run dev
```

---

## Still Having Issues?

1. **Check Documentation**
   - [QUICK_START.md](./QUICK_START.md)
   - [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
   - [AUTH_FLOW.md](./AUTH_FLOW.md)

2. **Check Logs**
   - Backend terminal output
   - Frontend terminal output
   - Browser DevTools console
   - Auth0 Dashboard logs

3. **Verify Configuration**
   - All environment variables set
   - Auth0 URLs configured correctly
   - Ports not blocked by firewall

4. **Search Error Messages**
   - Copy exact error message
   - Search in documentation
   - Search on Stack Overflow

5. **Start from Scratch**
   - Follow [QUICK_START.md](./QUICK_START.md) exactly
   - Don't skip steps
