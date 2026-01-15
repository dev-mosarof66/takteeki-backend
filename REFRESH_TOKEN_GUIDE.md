# Refresh Token System Guide

## Overview

The application now implements a secure refresh token system that provides:
- Short-lived access tokens (15 minutes default)
- Long-lived refresh tokens (30 days default)
- Token revocation capabilities
- Multi-device support with logout from all devices
- Security tracking (IP address, user agent)

## Architecture

### Token Types

1. **Access Token (JWT)**
   - Short-lived (15 minutes)
   - Contains user info (userId, email, role)
   - Used in `Authorization: Bearer <token>` header
   - Stored on client side (memory/localStorage)

2. **Refresh Token**
   - Long-lived (30 days)
   - Random 128-character hex string
   - Stored in database (`refresh_tokens` table)
   - Used to obtain new access tokens
   - Can be revoked

### Database Schema

The `refresh_tokens` table includes:
- `token` - The refresh token string (unique)
- `userId` - Foreign key to users table
- `expiresAt` - Token expiration date
- `isActive` - Whether token is active (can be revoked)
- `userAgent` - Browser/client info
- `ipAddress` - Client IP address
- Standard BaseEntity fields (id, createdAt, updatedAt, deletedAt)

## API Endpoints

### 1. Register
```bash
POST /api/auth/register
```
Returns both access token and refresh token.

### 2. Login
```bash
POST /api/auth/login
```
Returns both access token and refresh token.

### 3. Refresh Access Token
```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token-here"
}
```

Response:
```json
{
  "status": "success",
  "token": "new-access-token",
  "refreshToken": "same-refresh-token"
}
```

### 4. Logout (Single Device)
```bash
POST /api/auth/logout
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "refreshToken": "refresh-token-to-revoke"
}
```

### 5. Logout All Devices
```bash
POST /api/auth/logout-all
Authorization: Bearer <access-token>
```

Revokes all refresh tokens for the authenticated user.

## Client Implementation

### Storing Tokens

```typescript
// After login/register
const { token, refreshToken } = await login(credentials);

// Store access token (short-lived, in memory preferred)
localStorage.setItem('accessToken', token);

// Store refresh token (long-lived, secure storage)
localStorage.setItem('refreshToken', refreshToken);
```

### Using Access Token

```typescript
// Make API requests
const response = await fetch('/api/protected-route', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

### Handling Token Expiry

```typescript
async function makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
  let accessToken = localStorage.getItem('accessToken');
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    // If token expired, refresh it
    if (response.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      
      if (refreshResponse.ok) {
        const { token, refreshToken: newRefreshToken } = await refreshResponse.json();
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Retry original request
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        // Refresh failed, redirect to login
        localStorage.clear();
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    }
    
    return response;
  } catch (error) {
    throw error;
  }
}
```

## Security Best Practices

1. **Access Token Storage**
   - Prefer memory storage over localStorage
   - Use httpOnly cookies if possible (requires CORS configuration)
   - Never store in plain text

2. **Refresh Token Storage**
   - Use secure storage (httpOnly cookies recommended)
   - If using localStorage, ensure HTTPS
   - Consider token encryption

3. **Token Rotation** (Future Enhancement)
   - Currently, refresh tokens are reused
   - Consider implementing token rotation for better security
   - Rotate refresh token on each use

4. **Token Cleanup**
   - Implement periodic cleanup of expired tokens
   - Use the `deleteExpiredTokens()` method in a cron job

## Migration

To add the refresh_tokens table, run:

```bash
npm run migration:generate -- -n CreateRefreshTokensTable
npm run migration:run
```

Or if using synchronize in development, the table will be created automatically.

## Environment Variables

```env
JWT_SECRET=your-access-token-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=30d
```

## Testing

### Test Refresh Flow

1. Register/Login to get tokens
2. Wait for access token to expire (or use expired token)
3. Call `/api/auth/refresh` with refresh token
4. Verify new access token works

### Test Logout

1. Login to get tokens
2. Call `/api/auth/logout` with refresh token
3. Try to refresh - should fail
4. Verify token is marked as inactive in database

### Test Logout All

1. Login from multiple devices/browsers
2. Call `/api/auth/logout-all` from one device
3. Verify all refresh tokens are revoked
4. Try to refresh from other devices - should fail



