# InstaAlert Deployment Guide

## Issues Fixed

### 1. Login Failed Issue (Cross-Domain Authentication)
**Problem**: The frontend on Vercel (https://inst-alert.vercel.app) was making API calls directly to Render (https://instalert-atbh.onrender.com). Cookies set by Render cannot be accessed by Vercel due to cross-domain restrictions.

**Solution**: 
- Switched from cookie-based authentication to token-based authentication using Authorization headers
- JWT token is now returned in the login/register response body
- Frontend stores the token in localStorage and sends it via `Authorization: Bearer <token>` header
- Backend middleware now accepts tokens from both cookies and Authorization header

### 2. CORS Configuration
**Problem**: CORS was not properly configured for the Vercel deployment.

**Solution**:
- Updated backend CORS to allow requests from Vercel domain
- Added `CLIENT_URL` environment variable support with multiple URLs (comma-separated)
- Updated Socket.io CORS configuration

### 3. Vercel Rewrites
**Problem**: The Next.js rewrites in `next.config.mjs` and `vercel.json` were conflicting.

**Solution**:
- Consolidated rewrites to use relative `/api/*` paths in `next.config.mjs`
- Updated `vercel.json` to only contain environment variables

## Files Modified

### Frontend (Sheriyans-Hackathon-incident-SaaS-frontend-main)
1. **`.env`** - Updated environment variables
   - `NEXT_PUBLIC_API_BASE_URL=/api` (relative path for rewrites)
   - `NEXT_PUBLIC_CLIENT_URL=https://inst-alert.vercel.app`
   - Removed trailing slash from URLs

2. **`next.config.mjs`** - Fixed API rewrites
   - Rewrites `/api/*` to `https://instalert-atbh.onrender.com/*`

3. **`lib/api-client.ts`** - Updated API client
   - Uses relative URLs for production (goes through rewrites)
   - Added Authorization header with token from localStorage
   - Stores token in localStorage on login/register

4. **`lib/socket.ts`** - Updated Socket.io client
   - Added token-based authentication for Socket.io
   - Exports `updateSocketAuth` function to update token

5. **`context/AuthContext.tsx`** - Updated authentication context
   - Stores JWT token in localStorage on login/register
   - Clears token on logout
   - Updates Socket.io auth when token changes

6. **`vercel.json`** - Simplified configuration
   - Removed conflicting rewrites
   - Added environment variables section

### Backend (Sheriyans-Hackathon-Project-main)
1. **`.env`** - Updated environment variables
   - `CLIENT_URL=https://inst-alert.vercel.app,https://instalert-atbh.onrender.com`

2. **`src/app.js`** - Updated CORS configuration
   - Allow multiple origins via CLIENT_URL environment variable
   - Added better CORS debugging logs

3. **`src/controllers/auth.controller.js`** - Updated authentication
   - Login/register now returns JWT token in response body
   - Token is still set as cookie (for same-domain) AND returned in body (for cross-domain)

4. **`src/middlewares/validateUser.middleware.js`** - Updated token validation
   - Now accepts tokens from both cookies AND Authorization header
   - Supports cross-domain authentication

5. **`src/socket/socket.js`** - Updated Socket.io authentication
   - Added token-based auth middleware for Socket.io connections
   - Accepts token from auth object or cookies

## Deployment Steps

### Backend (Render.com)
1. Ensure your backend is deployed at: https://instalert-atbh.onrender.com
2. Update Environment Variables in Render dashboard:
   ```
   CLIENT_URL=https://inst-alert.vercel.app,https://instalert-atbh.onrender.com
   MONGODB_URI=mongodb+srv://manas:YMKiwWTGNXTOfhuX@cluster0.6axagjy.mongodb.net/hackathon-shery
   JWT_SECRET=781a2827068d8f0214592287f80448101bacd1e82d8826cbfc6f954cd8bf1262
   MISTRAL_API_KEY=pOIzyBH7yfkcXb5pAbNVNWG1xIBVrv2g
   GITHUB_CLIENT_ID=Ov23lijzbSEbAmoqzLFQ
   GITHUB_CLIENT_SECRET=96e3ca0d85ca4dd0fcef005488dacc6bdc834349
   PORT=3001
   ```
3. Redeploy the backend after pushing changes

### Frontend (Vercel)
1. Push the updated code to your Git repository
2. Connect your repository to Vercel (if not already done)
3. Set Environment Variables in Vercel dashboard:
   ```
   NEXT_PUBLIC_API_BASE_URL=/api
   NEXT_PUBLIC_SOCKET_URL=https://instalert-atbh.onrender.com
   NEXT_PUBLIC_CLIENT_URL=https://inst-alert.vercel.app
   ```
4. Deploy - Vercel will automatically build and deploy

## Testing the Fix

1. Open https://inst-alert.vercel.app
2. Try to login with your credentials
3. Login should now succeed and redirect to dashboard
4. Check browser DevTools > Application > Local Storage - you should see `auth_token`
5. Check Network tab - requests should have `Authorization: Bearer <token>` header

## Key Technical Details

- **Token Storage**: localStorage (accessible across domains)
- **Token Transmission**: Via `Authorization: Bearer <token>` header
- **Fallback**: Still supports cookies for same-domain requests
- **Socket.io Auth**: Token passed via `auth.token` in socket connection
- **API Rewrites**: Next.js rewrites proxy requests through Vercel, avoiding CORS issues for initial requests

## Troubleshooting

If login still fails:
1. Check Render logs for backend errors
2. Verify environment variables are set correctly on both platforms
3. Check browser console for errors
4. Verify the token is being stored in localStorage after login
5. Check Network tab to ensure Authorization header is being sent
