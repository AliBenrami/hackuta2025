# Authentication Flow

## Overview

This application uses **backend-controlled OAuth2** with **Auth0** as the identity provider. All authentication logic resides in the backend, making the frontend extremely simple.

## Authentication Method: Session Cookies

Instead of using JWT tokens on the frontend, we use **signed session cookies**:

- Session data is signed using `itsdangerous`
- Cookies are HttpOnly (not accessible via JavaScript)
- Cookies automatically sent with every request
- Backend verifies signature on each request

## Complete OAuth Flow

### Step-by-Step Process

```
┌─────────┐     ┌──────────┐     ┌─────────┐     ┌────────┐
│ Browser │     │ Frontend │     │ Backend │     │ Auth0  │
└────┬────┘     └────┬─────┘     └────┬────┘     └───┬────┘
     │               │                │              │
     │  1. Click     │                │              │
     │  "Login"      │                │              │
     ├──────────────►│                │              │
     │               │                │              │
     │               │  2. Redirect   │              │
     │               │  to /auth/login│              │
     │               ├───────────────►│              │
     │               │                │              │
     │               │                │ 3. Redirect  │
     │               │                │ to Auth0     │
     │               │                ├─────────────►│
     │               │                │              │
     │               │ 4. Show Auth0 Login Page      │
     │◄──────────────────────────────────────────────┤
     │               │                │              │
     │  5. User enters credentials    │              │
     ├───────────────────────────────────────────────►
     │               │                │              │
     │               │                │ 6. Redirect  │
     │               │                │ with code    │
     │               │                │◄─────────────┤
     │               │                │              │
     │               │                │ 7. Exchange  │
     │               │                │ code for     │
     │               │                │ tokens       │
     │               │                ├─────────────►│
     │               │                │              │
     │               │                │ 8. Return    │
     │               │                │ tokens       │
     │               │                │◄─────────────┤
     │               │                │              │
     │               │     9. Create user in DB      │
     │               │     10. Create session cookie │
     │               │                │              │
     │               │ 11. Redirect   │              │
     │               │ to frontend    │              │
     │               │ with cookie    │              │
     │               │◄───────────────┤              │
     │               │                │              │
     │ 12. Frontend  │                │              │
     │ now has       │                │              │
     │ session       │                │              │
     │◄──────────────┤                │              │
```

## Code Implementation

### Backend: Initiating Login (`/auth/login`)

```python
@app.get("/auth/login")
async def login(request: Request):
    """
    Initiate OAuth login flow with Auth0
    Redirects user to Auth0 login page
    """
    redirect_uri = request.url_for('auth_callback')
    return await oauth.auth0.authorize_redirect(request, redirect_uri)
```

**What happens:**

1. User lands on this endpoint
2. Backend generates OAuth authorization URL
3. Redirects browser to Auth0

### Backend: OAuth Callback (`/auth/callback`)

```python
@app.get("/auth/callback")
async def auth_callback(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    """
    OAuth callback endpoint
    Auth0 redirects here after successful login
    Creates/updates user in database and sets session cookie
    """
    # Exchange authorization code for token
    token = await oauth.auth0.authorize_access_token(request)

    # Get user info from token
    user_info = token.get('userinfo')

    # Create or update user in database
    user = await get_or_create_user(db, user_info)

    # Create session cookie
    session_data = {
        'sub': user_info['sub'],
        'email': user_info['email'],
        'name': user_info['name'],
    }

    # Redirect to frontend with session cookie
    redirect = RedirectResponse(url=f"{FRONTEND_URL}/")
    set_session_cookie(redirect, session_data)

    return redirect
```

**What happens:**

1. Auth0 redirects here with authorization code
2. Backend exchanges code for access token
3. Backend fetches user profile from Auth0
4. Backend creates/updates user in database
5. Backend creates signed session cookie
6. Backend redirects to frontend with cookie set

### Backend: Session Management (`session.py`)

```python
def create_session_token(user_data: dict) -> str:
    """Create a signed session token"""
    return serializer.dumps(user_data)

def verify_session_token(token: str) -> Optional[dict]:
    """Verify and decode a session token"""
    try:
        return serializer.loads(token, max_age=SESSION_MAX_AGE)
    except (BadSignature, SignatureExpired):
        return None

def set_session_cookie(response: Response, user_data: dict):
    """Set session cookie on response"""
    token = create_session_token(user_data)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=SESSION_MAX_AGE,
        httponly=True,
        secure=os.getenv("ENVIRONMENT") == "production",
        samesite="lax",
    )
```

### Frontend: Login Button

```typescript
export default function LoginButton() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Fetch current user on mount
    getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  if (user) {
    return (
      <button onClick={() => (window.location.href = getLogoutUrl())}>
        Logout
      </button>
    );
  }

  return (
    <button onClick={() => (window.location.href = getLoginUrl())}>
      Login
    </button>
  );
}
```

**What happens:**

1. Component checks if user is logged in via `/auth/me`
2. If logged in, shows user info and logout button
3. If not logged in, shows login button
4. Login button redirects to backend `/auth/login`

### Frontend: API Calls

```typescript
export async function getCurrentUser(): Promise<User | null> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    credentials: "include", // IMPORTANT: Send cookies
  });

  const data = await response.json();
  return data.user;
}
```

**Key point:** `credentials: 'include'` ensures cookies are sent with every request.

## Logout Flow

### Simple Logout

```
User clicks "Logout"
    ↓
Browser redirects to backend /auth/logout
    ↓
Backend clears session cookie
    ↓
Backend redirects to Auth0 logout
    ↓
Auth0 redirects back to frontend
    ↓
User is logged out
```

### Code

```python
@app.get("/auth/logout")
async def logout(request: Request):
    """Logout user by clearing session cookie"""
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    auth0_domain = os.getenv("AUTH0_DOMAIN")

    response = RedirectResponse(
        url=f"https://{auth0_domain}/v2/logout?returnTo={frontend_url}"
    )
    clear_session_cookie(response)

    return response
```

## Protected Routes

### Backend Protection

Every protected endpoint checks the session cookie:

```python
async def get_current_user_from_session(
    request: Request,
    db: AsyncSession
) -> User:
    """Get current user from session cookie"""
    session_data = await get_session_user(request)
    if not session_data:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Get user from database
    user = await db.get_user_by_id(session_data['sub'])
    return user
```

Usage in endpoints:

```python
@app.get("/images")
async def get_user_images(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    # Get current user from session
    current_user = await get_current_user_from_session(request, db)

    # Fetch user's images
    return await db.get_images_for_user(current_user.id)
```

## Security Features

### 1. HttpOnly Cookies

```python
httponly=True  # JavaScript cannot access this cookie
```

Prevents XSS attacks from stealing session tokens.

### 2. Signed Sessions

```python
serializer = URLSafeTimedSerializer(SECRET_KEY)
token = serializer.dumps(user_data)
```

Prevents tampering with session data.

### 3. Session Expiry

```python
SESSION_MAX_AGE = 60 * 60 * 24 * 7  # 7 days
```

Sessions automatically expire after 7 days.

### 4. Secure Flag (Production)

```python
secure=os.getenv("ENVIRONMENT") == "production"
```

HTTPS-only in production.

### 5. SameSite Protection

```python
samesite="lax"
```

Prevents CSRF attacks.

## Environment Variables

### Backend (.env)

```bash
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
SESSION_SECRET=your-secret-key-change-in-production
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Troubleshooting

### Issue: "Not authenticated" errors

**Solution:**

- Check if cookies are being sent: `credentials: 'include'`
- Check CORS configuration allows credentials
- Verify session hasn't expired

### Issue: Redirect loops

**Solution:**

- Check FRONTEND_URL is correctly set
- Verify callback URL is registered in Auth0

### Issue: "Failed to get user info"

**Solution:**

- Verify Auth0 credentials are correct
- Check scopes include 'openid profile email'
- Ensure token exchange is successful

## Advantages of This Approach

1. **Simpler Frontend**: No auth logic, just redirects
2. **More Secure**: Credentials never touch client
3. **Better UX**: Automatic authentication via cookies
4. **Easier Testing**: Backend handles everything
5. **SSR Compatible**: Works with server-side rendering
6. **No Token Management**: Backend handles token refresh

## Comparison to Client-Side Auth

| Feature       | Client-Side (NextAuth) | Backend-Controlled |
| ------------- | ---------------------- | ------------------ |
| Complexity    | High                   | Low                |
| Frontend Code | Heavy                  | Minimal            |
| Security      | Good                   | Better             |
| SSR Support   | Limited                | Full               |
| Token Storage | localStorage/cookie    | HttpOnly Cookie    |
| Refresh Logic | Client                 | Server             |
