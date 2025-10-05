# Environment Variables

Complete guide to all environment variables used in the application.

## Backend Environment Variables

Create a `.env` file in the `hackuta-backend` directory.

### Auth0 Configuration

```bash
# Auth0 Domain (your Auth0 tenant domain)
# Example: dev-abc123.us.auth0.com
AUTH0_DOMAIN=your-domain.auth0.com

# Auth0 Client ID (from your Auth0 application)
# Example: abcdefghijklmnopqrstuvwxyz123456
AUTH0_CLIENT_ID=your-client-id

# Auth0 Client Secret (from your Auth0 application)
# Example: abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
AUTH0_CLIENT_SECRET=your-client-secret

# Auth0 Audience (optional, for API authorization)
# Example: https://api.yourdomain.com
AUTH0_AUDIENCE=
```

**How to get these:**
1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Create a new Application (Regular Web Application)
3. Copy Domain, Client ID, and Client Secret

---

### Session Configuration

```bash
# Secret key for signing session cookies
# IMPORTANT: Change this to a random string in production
# Generate with: python -c "import secrets; print(secrets.token_hex(32))"
SESSION_SECRET=your-secret-key-change-in-production

# Session cookie name (optional, defaults to 'session')
SESSION_COOKIE_NAME=session

# Session max age in seconds (optional, defaults to 7 days)
# 7 days = 604800 seconds
SESSION_MAX_AGE=604800
```

**Generate a secure secret:**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

### Frontend Configuration

```bash
# Frontend URL (where your Next.js app is hosted)
# Development: http://localhost:3000
# Production: https://yourdomain.com
FRONTEND_URL=http://localhost:3000
```

---

### Database Configuration

```bash
# Database URL (defaults to SQLite)
# SQLite: sqlite+aiosqlite:///./hackuta.db
# PostgreSQL: postgresql+asyncpg://user:pass@localhost/dbname
DATABASE_URL=sqlite+aiosqlite:///./hackuta.db
```

**For production PostgreSQL:**
```bash
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/hackuta
```

---

### AWS S3 Configuration

```bash
# S3 Bucket name for image uploads
S3_BUCKET_NAME=your-bucket-name

# AWS Credentials (use AWS CLI credentials or environment variables)
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# AWS Region
AWS_REGION=us-east-1
```

**Note:** If using AWS EC2/ECS, IAM roles are preferred over access keys.

---

### Server Configuration

```bash
# Environment (development or production)
ENVIRONMENT=development

# Server host (optional, defaults to 0.0.0.0)
HOST=0.0.0.0

# Server port (optional, defaults to 8000)
PORT=8000
```

---

### Complete Backend `.env` Example

```bash
# Auth0
AUTH0_DOMAIN=dev-abc123.us.auth0.com
AUTH0_CLIENT_ID=abcdefghijklmnopqrstuvwxyz123456
AUTH0_CLIENT_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz

# Session
SESSION_SECRET=f1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=sqlite+aiosqlite:///./hackuta.db

# AWS S3
S3_BUCKET_NAME=hackuta-images
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1

# Server
ENVIRONMENT=development
```

---

## Frontend Environment Variables

Create a `.env.local` file in the `hackuta-frontend` directory.

### API Configuration

```bash
# Backend API URL
# Development: http://localhost:8000
# Production: https://api.yourdomain.com
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Important:** 
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Never put secrets in `NEXT_PUBLIC_` variables

---

### Complete Frontend `.env.local` Example

```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Auth0 Configuration

### Application Settings

In your Auth0 Application settings, configure:

**Allowed Callback URLs:**
```
http://localhost:8000/auth/callback
https://api.yourdomain.com/auth/callback
```

**Allowed Logout URLs:**
```
http://localhost:3000
https://yourdomain.com
```

**Allowed Web Origins:**
```
http://localhost:3000
https://yourdomain.com
```

**Allowed Origins (CORS):**
```
http://localhost:3000
https://yourdomain.com
```

---

## Production Checklist

### Backend

- [ ] Change `SESSION_SECRET` to a secure random value
- [ ] Set `ENVIRONMENT=production`
- [ ] Use PostgreSQL instead of SQLite
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Configure AWS credentials via IAM roles
- [ ] Add all Auth0 production URLs
- [ ] Enable HTTPS (set `secure` flag on cookies)

### Frontend

- [ ] Set `NEXT_PUBLIC_API_URL` to production API
- [ ] Remove any development-only code
- [ ] Test with production Auth0 application

### Auth0

- [ ] Add production callback URLs
- [ ] Add production logout URLs
- [ ] Configure CORS for production domain
- [ ] Review security settings

---

## Environment-Specific Files

### Development
```
hackuta-backend/.env
hackuta-frontend/.env.local
```

### Production
```
# Use environment variables from hosting platform:
# - Vercel: Environment Variables in dashboard
# - AWS: Systems Manager Parameter Store
# - Docker: docker-compose.yml or Kubernetes secrets
```

---

## Loading Environment Variables

### Backend (Python)

```python
from dotenv import load_dotenv
import os

load_dotenv()  # Load from .env file

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
```

### Frontend (Next.js)

```typescript
// Automatically loaded by Next.js from .env.local

const API_URL = process.env.NEXT_PUBLIC_API_URL;
```

---

## Troubleshooting

### Issue: "Environment variable not found"

**Solution:**
1. Check file is named exactly `.env` (not `env.txt`)
2. Restart the server after changing `.env`
3. Verify file is in correct directory

### Issue: Frontend can't access environment variable

**Solution:**
- Ensure variable starts with `NEXT_PUBLIC_`
- Rebuild frontend: `npm run build`

### Issue: Auth0 redirect URI mismatch

**Solution:**
- Add callback URL to Auth0 dashboard
- Ensure `FRONTEND_URL` matches Auth0 settings
- Check for trailing slashes

---

## Security Best Practices

1. **Never commit `.env` files**
   - Add to `.gitignore`
   - Use `.env.example` for documentation

2. **Use different Auth0 applications**
   - Development: `dev-xxx.auth0.com`
   - Production: `prod-xxx.auth0.com`

3. **Rotate secrets regularly**
   - Change `SESSION_SECRET` monthly
   - Rotate AWS keys

4. **Use secrets management**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Docker secrets

5. **Principle of least privilege**
   - AWS IAM: Only required S3 permissions
   - Auth0: Minimal scopes

---

## Template Files

### Backend `.env.example`

```bash
# Copy this file to .env and fill in your values

# Auth0
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

# Session
SESSION_SECRET=
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=sqlite+aiosqlite:///./hackuta.db

# AWS S3
S3_BUCKET_NAME=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1

# Server
ENVIRONMENT=development
```

### Frontend `.env.local.example`

```bash
# Copy this file to .env.local and fill in your values

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000
```
