# @inspectos/auth

Shared authentication utilities for web, mobile, and server.

## Structure

```
/auth/
  /client/   - Client-side auth helpers (web, mobile)
  /server/   - Server-side JWT validation (API server)
```

## Usage

### Client Side (Web/Mobile)

```typescript
import { getUserFromSession, isSessionExpired, getAccessToken } from '@inspectos/auth/client';

const user = getUserFromSession(session);
const isExpired = isSessionExpired(session);
const token = getAccessToken(session);
```

### Server Side (API)

```typescript
import { verifyJWT, extractBearerToken } from '@inspectos/auth/server';

const authHeader = request.headers.get('authorization');
const token = extractBearerToken(authHeader);

if (token) {
  const decoded = await verifyJWT(token, process.env.SUPABASE_JWT_SECRET!);
  if (decoded) {
    const userId = decoded.sub;
    const email = decoded.email;
  }
}
```

## Auth Routes

Auth API routes are in the central API server:

```
apps/server/app/api/auth/
  /register/    - User registration
  /login/       - User login (if needed)
```
