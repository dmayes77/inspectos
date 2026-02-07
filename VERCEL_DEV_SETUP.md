# Vercel Development Deployment Setup (dev.inspectos.co)

This guide explains how to set up a development deployment on Vercel that uses BYPASS_AUTH for testing without full authentication.

## Overview

The codebase supports three development environments:
1. **Local Development** - `NODE_ENV=development` (localhost)
2. **Vercel Preview** - `VERCEL_ENV=preview` (PR preview deployments)
3. **Custom Dev Domain** - `NEXT_PUBLIC_IS_DEV_DEPLOYMENT=true` (dev.inspectos.co)

## Setting up dev.inspectos.co

### Step 1: Add Custom Domain in Vercel

1. Go to your Vercel project settings
2. Navigate to **Domains**
3. Add `dev.inspectos.co` as a custom domain
4. Update your DNS to point to Vercel:
   - Add a CNAME record: `dev` → `cname.vercel-dns.com`

### Step 2: Configure Environment Variables

In Vercel project settings → **Environment Variables**, add these for **Preview** environment only:

#### Required for Both Apps (web + server):

```env
# Development mode flag (CRITICAL - only set for dev.inspectos.co!)
NEXT_PUBLIC_IS_DEV_DEPLOYMENT=true

# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=https://wcafvfhvgjjijwxlgdzy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

SUPABASE_URL=https://wcafvfhvgjjijwxlgdzy.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Development-only settings
BYPASS_AUTH=true
SUPABASE_TENANT_ID=f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3
NEXT_PUBLIC_SUPABASE_TENANT_ID=f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3
```

#### Web App Specific:

```env
# Central API URL (point to your dev API deployment)
NEXT_PUBLIC_API_URL=https://dev-api.inspectos.co/api

# Logo.dev integration
NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY=your_key_here
LOGO_DEV_SECRET_KEY=your_secret_here

# Feature flags (all true for dev environment)
NEXT_PUBLIC_USE_EXTERNAL_API_LEADS=true
NEXT_PUBLIC_USE_EXTERNAL_API_CLIENTS=true
NEXT_PUBLIC_USE_EXTERNAL_API_SERVICES=true
NEXT_PUBLIC_USE_EXTERNAL_API_INSPECTORS=true
NEXT_PUBLIC_USE_EXTERNAL_API_PROPERTIES=true
NEXT_PUBLIC_USE_EXTERNAL_API_AGENCIES=true
NEXT_PUBLIC_USE_EXTERNAL_API_AGENTS=true
NEXT_PUBLIC_USE_EXTERNAL_API_ORDERS=true
NEXT_PUBLIC_USE_EXTERNAL_API_INSPECTIONS=true
NEXT_PUBLIC_USE_EXTERNAL_API_INVOICES=true
NEXT_PUBLIC_USE_EXTERNAL_API_SCHEDULE=true
NEXT_PUBLIC_USE_EXTERNAL_API_TAGS=true
NEXT_PUBLIC_USE_EXTERNAL_API_VENDORS=true
NEXT_PUBLIC_USE_EXTERNAL_API_EMAIL_TEMPLATES=true
NEXT_PUBLIC_USE_EXTERNAL_API_TAG_ASSIGNMENTS=true
NEXT_PUBLIC_USE_EXTERNAL_API_INTEGRATIONS=true
NEXT_PUBLIC_USE_EXTERNAL_API_WEBHOOKS=true
```

### Step 3: Deploy Separate Apps

You need TWO Vercel projects:

#### 1. Central API Server (`apps/server`)
- **Project Name**: `inspectos-api-dev`
- **Domain**: `dev-api.inspectos.co`
- **Root Directory**: `apps/server`
- **Framework**: Next.js
- **Build Command**: `pnpm build`
- **Install Command**: `pnpm install`

#### 2. Web App (`apps/web`)
- **Project Name**: `inspectos-web-dev`
- **Domain**: `dev.inspectos.co`
- **Root Directory**: `apps/web`
- **Framework**: Next.js
- **Build Command**: `pnpm build`
- **Install Command**: `pnpm install`

### Step 4: Configure CORS

The central API's `proxy.ts` needs to allow requests from dev.inspectos.co.

Update the allowed origins in `apps/server/proxy.ts`:

```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://dev.inspectos.co',
  process.env.NEXT_PUBLIC_WEB_URL, // Production web app URL
].filter(Boolean);
```

## How It Works

### Development Mode Detection

The code checks three conditions to determine if BYPASS_AUTH should be enabled:

```typescript
const IS_DEVELOPMENT =
  process.env.NODE_ENV === 'development' ||           // Local dev
  process.env.VERCEL_ENV === 'preview' ||            // Vercel preview PRs
  process.env.NEXT_PUBLIC_IS_DEV_DEPLOYMENT === 'true'; // Custom dev domain
```

### Security Guarantees

- **Production** (`inspectos.co`) will NEVER use BYPASS_AUTH even if accidentally configured
- **Preview deployments** can optionally use BYPASS_AUTH (useful for testing)
- **Dev domain** (`dev.inspectos.co`) uses BYPASS_AUTH for development/testing

### Access Token Flow

**Development (BYPASS_AUTH enabled):**
```
Browser → API Client → bypass-token → Central API → BYPASS_AUTH check → Service Client
```

**Production (BYPASS_AUTH disabled):**
```
Browser → API Client → Supabase session → Central API → User Client with JWT
```

## Verification

After deployment, verify the setup:

1. **Check Environment Detection:**
   ```typescript
   console.log('IS_DEVELOPMENT:', IS_DEVELOPMENT);
   console.log('BYPASS_AUTH:', BYPASS_AUTH);
   ```

2. **Test API Call:**
   - Navigate to `https://dev.inspectos.co/admin/clients`
   - Open DevTools Network tab
   - Verify requests go to `https://dev-api.inspectos.co/api/admin/clients`
   - Check that data loads successfully

3. **Verify Security:**
   - Deploy to production domain
   - Confirm BYPASS_AUTH is NOT enabled even if env vars are present

## Troubleshooting

### Data Not Loading
- Check that both web and server deployments have `NEXT_PUBLIC_IS_DEV_DEPLOYMENT=true`
- Verify CORS is allowing dev.inspectos.co
- Check server logs for authentication errors

### CORS Errors
- Ensure proxy.ts includes dev.inspectos.co in allowed origins
- Verify OPTIONS preflight requests return 204

### Wrong Tenant
- Confirm `SUPABASE_TENANT_ID` is set on server
- Verify `NEXT_PUBLIC_SUPABASE_TENANT_ID` is set on web app

## Production Checklist

Before deploying to production (`inspectos.co`):

- [ ] Remove or set `NEXT_PUBLIC_IS_DEV_DEPLOYMENT=false`
- [ ] Remove `BYPASS_AUTH=true`
- [ ] Configure proper Supabase Auth
- [ ] Update CORS to allow production domain only
- [ ] Test authentication flow with real users
