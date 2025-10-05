# Adsett - AI-Powered Ad Creative Feedback

> Smarter Ads. Sharper Insights.

Adsett is an AI-driven platform for marketing teams and creators to receive intelligent feedback on ad creatives, manage assets, and track performance - all in one place.

**Built at HackUTA 2025** 🚀

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Auth0 account (free)

### Setup (5 minutes)

1. **Clone the repository**

```bash
git clone <repo-url>
cd hackuta2025
```

2. **Follow the complete setup guide**

```bash
# Read the step-by-step guide
open SETUP_GUIDE.md
```

Or jump to: **[Complete Setup Guide](./SETUP_GUIDE.md)** 📖

### Quick Run (if already set up)

**Terminal 1 - Backend:**

```bash
cd hackuta-backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app:app --reload --port 8000
```

**Terminal 2 - Frontend:**

```bash
cd hackuta-frontend
npm run dev
```

**Open:** http://localhost:3000

---

## Features

✨ **AI-Powered Feedback** - Get intelligent critiques on your ad creatives  
📤 **Asset Management** - Centralize all your creative assets  
📊 **Performance Tracking** - Monitor how your ads perform  
🔐 **Secure Authentication** - OAuth2 with Auth0  
⚡ **Real-time Analysis** - Instant feedback on uploads

---

## Tech Stack

### Backend

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM with async support
- **Authlib** - OAuth2 implementation
- **SQLite** - Lightweight database (dev)
- **Python 3.10+**

### Frontend

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React 19** - UI library

### Authentication

- **Auth0** - OAuth2 identity provider
- **Session tokens** - Stored in localStorage + httpOnly cookies

---

## Project Structure

```
hackuta2025/
├── hackuta-backend/          # FastAPI backend
│   ├── app.py               # Main application
│   ├── oauth.py             # OAuth configuration
│   ├── session.py           # Session management
│   ├── database.py          # Database setup
│   ├── models.py            # Database models
│   └── requirements.txt     # Python dependencies
│
├── hackuta-frontend/         # Next.js frontend
│   ├── src/
│   │   ├── app/             # Pages
│   │   ├── components/      # React components
│   │   └── lib/             # API client
│   └── package.json         # Node dependencies
│
├── SETUP_GUIDE.md           # Complete setup instructions
├── ARCHITECTURE.md          # System architecture
├── API_REFERENCE.md         # API documentation
└── README.md                # This file
```

---

## Documentation

- 📖 **[Setup Guide](./SETUP_GUIDE.md)** - Step-by-step installation
- 🏗️ **[Architecture](./ARCHITECTURE.md)** - System design
- 🔐 **[Auth Flow](./AUTH_FLOW.md)** - Authentication details
- 📡 **[API Reference](./API_REFERENCE.md)** - Endpoint documentation
- 🔧 **[Development Guide](./DEVELOPMENT_GUIDE.md)** - Contributing
- 🚀 **[Deployment](./DEPLOYMENT.md)** - Production setup
- 🐛 **[Troubleshooting](./TROUBLESHOOTING.md)** - Common issues

---

## API Endpoints

### Authentication

- `GET /auth/login` - Initiate OAuth login
- `GET /auth/callback` - OAuth callback handler
- `GET /auth/logout` - Logout user
- `GET /auth/me` - Get current user

### Images

- `GET /images` - List user's images
- `POST /images` - Create image record
- `GET /images/{id}` - Get specific image
- `POST /analyze/image` - Upload and analyze image

**Interactive API Docs:** http://localhost:8000/docs (when backend is running)

---

## Environment Variables

### Backend `.env`

```bash
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
SESSION_SECRET=your-random-secret
FRONTEND_URL=http://localhost:3000
DATABASE_URL=sqlite+aiosqlite:///./hackuta.db
ENVIRONMENT=development
```

### Frontend `.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

See **[Setup Guide](./SETUP_GUIDE.md)** for detailed instructions.

---

## How It Works

### Authentication Flow

1. User clicks "Login" → Redirects to backend
2. Backend redirects to Auth0 login
3. User authenticates with Auth0
4. Auth0 redirects back to backend with code
5. Backend exchanges code for user info
6. Backend creates session token
7. Frontend stores token in localStorage
8. User is authenticated! ✅

**All auth logic is backend-controlled** - frontend just stores and sends tokens.

### API Communication

All API calls include the session token:

```typescript
fetch("http://localhost:8000/api/endpoint", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
  credentials: "include",
});
```

---

## Development

### Backend Development

```bash
cd hackuta-backend
source venv/bin/activate

# Run with auto-reload
uvicorn app:app --reload

# View API docs
open http://localhost:8000/docs
```

### Frontend Development

```bash
cd hackuta-frontend

# Run development server
npm run dev

# Open in browser
open http://localhost:3000
```

### Making Changes

1. Backend changes auto-reload (if using `--reload`)
2. Frontend has Fast Refresh (instant updates)
3. Check browser console and terminal for errors

---

## Common Tasks

### Reset Database

```bash
cd hackuta-backend
rm hackuta.db
python3 -c "from database import init_db; import asyncio; asyncio.run(init_db())"
```

### Clear User Session

```javascript
// In browser console
localStorage.clear();
// Then refresh page
```

### View Logs

```bash
# Backend logs in terminal running uvicorn
# Frontend logs in browser console (F12)
```

---

## Troubleshooting

### Login not working?

1. Check Auth0 callback URL is configured: `http://localhost:8000/auth/callback`
2. Check backend logs for errors
3. Check browser console for errors
4. Verify `.env` files have correct Auth0 credentials

### Session not persisting?

1. Check if token is in localStorage: `localStorage.getItem('session_token')`
2. Try in incognito mode to rule out extensions
3. Clear all cookies and localStorage for localhost

**Full troubleshooting guide:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## Team

Built with ❤️ at HackUTA 2025

---

## License

MIT License - feel free to use this project as a starting point for your own!

---

## Getting Started

👉 **[Read the Setup Guide](./SETUP_GUIDE.md)** to get started in 5 minutes!

Questions? Issues? Check the [Troubleshooting Guide](./TROUBLESHOOTING.md) or documentation linked above.
