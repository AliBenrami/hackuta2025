# Deployment Guide

Complete guide for deploying the application to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Database Migration](#database-migration)
5. [Monitoring](#monitoring)
6. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Security

- [ ] Change `SESSION_SECRET` to a secure random value
- [ ] Use environment variables (not `.env` files) in production
- [ ] Enable HTTPS (TLS certificates)
- [ ] Set secure cookie flags (`secure=True`, `httponly=True`)
- [ ] Configure CORS to only allow your frontend domain
- [ ] Review Auth0 security settings
- [ ] Use IAM roles instead of AWS access keys
- [ ] Enable rate limiting
- [ ] Add security headers (HSTS, CSP, etc.)

### Configuration

- [ ] Set `ENVIRONMENT=production`
- [ ] Update `FRONTEND_URL` to production domain
- [ ] Update `AUTH0_DOMAIN` to production Auth0 tenant
- [ ] Add production callback URLs to Auth0
- [ ] Configure production database (PostgreSQL)
- [ ] Set up S3 bucket with proper permissions
- [ ] Configure CDN for static assets
- [ ] Set up logging and monitoring

### Testing

- [ ] Test all endpoints in production-like environment
- [ ] Test authentication flow end-to-end
- [ ] Test image upload and analysis
- [ ] Load testing for expected traffic
- [ ] Test error scenarios
- [ ] Verify CORS configuration

---

## Backend Deployment

### Option 1: AWS (EC2 or ECS)

#### EC2 Deployment

**1. Launch EC2 Instance**
```bash
# Choose Amazon Linux 2 or Ubuntu
# Configure security group:
# - Allow HTTP (80)
# - Allow HTTPS (443)
# - Allow SSH (22) from your IP only
```

**2. Connect and Setup**
```bash
# Connect via SSH
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Python
sudo yum install python3 python3-pip  # Amazon Linux
# or
sudo apt install python3 python3-pip  # Ubuntu

# Clone repository
git clone <your-repo-url>
cd hackuta2025/hackuta-backend

# Install dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**3. Set Environment Variables**
```bash
# Create .env file or use AWS Systems Manager Parameter Store
nano .env
# Add all production environment variables
```

**4. Install and Configure Nginx**
```bash
sudo yum install nginx  # Amazon Linux
# or
sudo apt install nginx  # Ubuntu

# Configure Nginx as reverse proxy
sudo nano /etc/nginx/conf.d/api.conf
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**5. Install SSL Certificate**
```bash
# Install Certbot
sudo yum install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com
```

**6. Setup systemd Service**
```bash
sudo nano /etc/systemd/system/hackuta-api.service
```

**Service Configuration:**
```ini
[Unit]
Description=HackUTA FastAPI Application
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/home/ec2-user/hackuta2025/hackuta-backend
Environment="PATH=/home/ec2-user/hackuta2025/hackuta-backend/venv/bin"
ExecStart=/home/ec2-user/hackuta2025/hackuta-backend/venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4

[Install]
WantedBy=multi-user.target
```

**7. Start Service**
```bash
sudo systemctl daemon-reload
sudo systemctl enable hackuta-api
sudo systemctl start hackuta-api
sudo systemctl status hackuta-api
```

#### ECS/Fargate Deployment

**1. Create Dockerfile**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

**2. Build and Push to ECR**
```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t hackuta-api .

# Tag image
docker tag hackuta-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/hackuta-api:latest

# Push image
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/hackuta-api:latest
```

**3. Create ECS Task Definition**
```json
{
  "family": "hackuta-api",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "hackuta-api",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/hackuta-api:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "ENVIRONMENT", "value": "production"}
      ],
      "secrets": [
        {"name": "AUTH0_CLIENT_SECRET", "valueFrom": "arn:aws:secretsmanager:..."}
      ]
    }
  ]
}
```

**4. Create ECS Service**
```bash
aws ecs create-service \
  --cluster hackuta-cluster \
  --service-name hackuta-api \
  --task-definition hackuta-api \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

---

### Option 2: Heroku

**1. Install Heroku CLI**
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Other platforms: https://devcenter.heroku.com/articles/heroku-cli
```

**2. Create Procfile**
```
web: uvicorn app:app --host 0.0.0.0 --port $PORT --workers 4
```

**3. Deploy**
```bash
cd hackuta-backend

# Login to Heroku
heroku login

# Create app
heroku create hackuta-api

# Set environment variables
heroku config:set AUTH0_DOMAIN=your-domain.auth0.com
heroku config:set AUTH0_CLIENT_ID=your-client-id
heroku config:set AUTH0_CLIENT_SECRET=your-client-secret
heroku config:set SESSION_SECRET=your-secret
heroku config:set FRONTEND_URL=https://yourdomain.com
heroku config:set DATABASE_URL=postgres://...

# Deploy
git push heroku main

# Check logs
heroku logs --tail
```

---

### Option 3: DigitalOcean App Platform

**1. Create `app.yaml`**
```yaml
name: hackuta-api
services:
- name: api
  github:
    repo: your-username/hackuta2025
    branch: main
    deploy_on_push: true
  source_dir: /hackuta-backend
  http_port: 8000
  run_command: uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
  envs:
  - key: ENVIRONMENT
    value: production
  - key: AUTH0_DOMAIN
    value: your-domain.auth0.com
    type: SECRET
  - key: AUTH0_CLIENT_ID
    value: your-client-id
    type: SECRET
  - key: AUTH0_CLIENT_SECRET
    value: your-client-secret
    type: SECRET
```

**2. Deploy**
```bash
doctl apps create --spec app.yaml
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended for Next.js)

**1. Install Vercel CLI**
```bash
npm install -g vercel
```

**2. Deploy**
```bash
cd hackuta-frontend

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

**3. Configure Custom Domain**
```bash
vercel domains add yourdomain.com
```

---

### Option 2: Netlify

**1. Build Configuration**
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NEXT_PUBLIC_API_URL = "https://api.yourdomain.com"
```

**2. Deploy**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

---

### Option 3: AWS S3 + CloudFront

**1. Build Static Export**
```bash
cd hackuta-frontend

# Build for production
npm run build

# Export static files
npm run export
```

**2. Upload to S3**
```bash
aws s3 sync out/ s3://your-bucket-name --delete
```

**3. Configure CloudFront**
- Create CloudFront distribution
- Point to S3 bucket
- Add custom domain
- Configure SSL certificate

---

## Database Migration

### From SQLite to PostgreSQL

**1. Install PostgreSQL**
```bash
# AWS RDS, or self-hosted PostgreSQL
```

**2. Update Backend Configuration**
```bash
# .env
DATABASE_URL=postgresql+asyncpg://username:password@host:5432/database
```

**3. Migrate Data** (if needed)
```bash
# Export SQLite data
sqlite3 hackuta.db .dump > dump.sql

# Convert to PostgreSQL format (manual editing required)
# Import to PostgreSQL
psql -U username -d database -f dump_postgres.sql
```

**4. Update Requirements**
```bash
# Add to requirements.txt
asyncpg==0.29.0
```

---

## Monitoring

### Backend Monitoring

**1. Application Logs**
```python
# Add to app.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
```

**2. Health Check Endpoint**
```python
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}
```

**3. Error Tracking**
```bash
# Install Sentry
pip install sentry-sdk[fastapi]
```

```python
# In app.py
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    environment="production",
)
```

### Frontend Monitoring

**1. Vercel Analytics**
```bash
npm install @vercel/analytics
```

```typescript
// In app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**2. Error Tracking**
```bash
npm install @sentry/nextjs
```

---

## Performance Optimization

### Backend

1. **Add Caching**
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def expensive_operation():
    pass
```

2. **Connection Pooling**
```python
# In database.py
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=0
)
```

3. **Compression**
```python
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
```

### Frontend

1. **Image Optimization**
```typescript
import Image from 'next/image';

<Image 
  src="/image.jpg" 
  width={500} 
  height={300} 
  alt="Description" 
/>
```

2. **Code Splitting**
```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});
```

---

## Troubleshooting

### Issue: 502 Bad Gateway

**Solution:**
- Check if backend is running: `systemctl status hackuta-api`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Verify port configuration

### Issue: CORS errors in production

**Solution:**
- Update `FRONTEND_URL` in backend
- Check CORS middleware configuration
- Ensure cookies are sent with `credentials: 'include'`

### Issue: Session not persisting

**Solution:**
- Check `secure` flag (must match HTTPS)
- Verify `samesite` configuration
- Check cookie domain

### Issue: Database connection errors

**Solution:**
- Verify `DATABASE_URL` is correct
- Check database server is accessible
- Verify security group/firewall rules

---

## Rollback Procedure

### Heroku
```bash
heroku releases
heroku rollback v123
```

### ECS
```bash
# Update service to previous task definition
aws ecs update-service --cluster hackuta-cluster --service hackuta-api --task-definition hackuta-api:123
```

### Manual
```bash
git revert HEAD
git push origin main
# Redeploy
```

---

## Post-Deployment

1. **Verify Authentication**
   - Test login flow
   - Check session persistence
   - Verify logout

2. **Test Core Features**
   - Image upload
   - Image listing
   - User profile

3. **Monitor Performance**
   - Check response times
   - Monitor error rates
   - Review logs

4. **Set Up Alerts**
   - CloudWatch alarms
   - Sentry notifications
   - Uptime monitoring (UptimeRobot, Pingdom)

---

## Scaling

### Horizontal Scaling

**Backend:**
- Use load balancer (ALB, Nginx)
- Run multiple instances
- Use Redis for session storage (shared sessions)

**Database:**
- Read replicas for read-heavy workloads
- Connection pooling
- Database caching (Redis)

### Vertical Scaling

- Increase instance size
- More CPU/memory
- Larger database instance

---

## Backup Strategy

### Database Backups

**Automated backups:**
```bash
# PostgreSQL
pg_dump -U username database > backup.sql

# Automate with cron
0 2 * * * pg_dump -U username database > /backups/$(date +\%Y\%m\%d).sql
```

### S3 Backups

- Enable S3 versioning
- Configure lifecycle policies
- Cross-region replication

---

## Maintenance

### Regular Tasks

- [ ] Review logs weekly
- [ ] Check error rates
- [ ] Monitor disk usage
- [ ] Update dependencies monthly
- [ ] Rotate secrets quarterly
- [ ] Review security settings
- [ ] Performance testing
- [ ] Backup verification

### Updates

```bash
# Backend dependencies
pip install --upgrade -r requirements.txt

# Frontend dependencies
npm update

# System packages
sudo yum update  # Amazon Linux
sudo apt update && sudo apt upgrade  # Ubuntu
```

---

For more information, see:
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
