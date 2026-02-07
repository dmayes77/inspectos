# Vercel Deployment Guide - Two Projects with Environment Variables

This guide shows how to deploy the monorepo to Vercel using **2 projects** with environment-based configuration for production and development.

## Architecture Overview

**2 Vercel Projects:**
1. **inspectos-web** - Web application (apps/web)
   - Production: `inspectos.co` (main branch)
   - Preview/Dev: `dev.inspectos.co` (preview deployments)

2. **inspectos-api** - Central API (apps/server)
   - Production: `api.inspectos.co` (main branch)
   - Preview/Dev: `dev-api.inspectos.co` (preview deployments)

**Key Benefit:** One Git repo, two projects, automatic deployments, environment-specific configuration.

---

## Project 1: Web App Setup

### Create Vercel Project

1. Go to Vercel Dashboard → **Add New Project**
2. Import your Git repository
3. Configure:
   - **Project Name:** `inspectos-web`
   - **Framework:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** `cd ../.. && pnpm install && cd apps/web && pnpm build`
   - **Install Command:** `pnpm install`

### Add Domains

1. Go to Project Settings → **Domains**
2. Add production domain: `inspectos.co`
3. Add development domain: `dev.inspectos.co`
4. Configure DNS:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com

   Type: CNAME
   Name: dev
   Value: cname.vercel-dns.com
   ```

### Configure Branch Deployment

1. Go to Project Settings → **Git**
2. **Production Branch:** `main`
3. **Automatic Deployments from Git:** Enable for all branches
4. Go to Domains settings:
   - Assign `inspectos.co` → Production (main branch)
   - Assign `dev.inspectos.co` → Preview (all other branches/PRs)

### Environment Variables - Production

Go to Project Settings → **Environment Variables** → Select **Production**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wcafvfhvgjjijwxlgdzy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Central API - Production
NEXT_PUBLIC_API_URL=https://api.inspectos.co/api

# Logo.dev Integration
NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY=your_key_here
LOGO_DEV_SECRET_KEY=your_secret_here

# Feature Flags - Enable External API
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

# DO NOT SET - These should NOT exist in production:
# ❌ BYPASS_AUTH
# ❌ NEXT_PUBLIC_IS_DEV_DEPLOYMENT
# ❌ NEXT_PUBLIC_SUPABASE_TENANT_ID
```

### Environment Variables - Preview

Go to Project Settings → **Environment Variables** → Select **Preview**

```env
# Development Mode Flag (REQUIRED for dev.inspectos.co)
NEXT_PUBLIC_IS_DEV_DEPLOYMENT=true

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://wcafvfhvgjjijwxlgdzy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Central API - Development
NEXT_PUBLIC_API_URL=https://dev-api.inspectos.co/api

# Development-only Tenant Override
NEXT_PUBLIC_SUPABASE_TENANT_ID=f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3

# Logo.dev Integration
NEXT_PUBLIC_LOGO_DEV_PUBLISHABLE_KEY=your_key_here
LOGO_DEV_SECRET_KEY=your_secret_here

# Feature Flags - Enable External API
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

---

## Project 2: API Server Setup

### Create Vercel Project

1. Go to Vercel Dashboard → **Add New Project**
2. Import the **same** Git repository
3. Configure:
   - **Project Name:** `inspectos-api`
   - **Framework:** Next.js
   - **Root Directory:** `apps/server`
   - **Build Command:** `cd ../.. && pnpm install && cd apps/server && pnpm build`
   - **Install Command:** `pnpm install`

### Add Domains

1. Go to Project Settings → **Domains**
2. Add production domain: `api.inspectos.co`
3. Add development domain: `dev-api.inspectos.co`
4. Configure DNS:
   ```
   Type: CNAME
   Name: api
   Value: cname.vercel-dns.com

   Type: CNAME
   Name: dev-api
   Value: cname.vercel-dns.com
   ```

### Configure Branch Deployment

1. Go to Project Settings → **Git**
2. **Production Branch:** `main`
3. **Automatic Deployments from Git:** Enable for all branches
4. Go to Domains settings:
   - Assign `api.inspectos.co` → Production (main branch)
   - Assign `dev-api.inspectos.co` → Preview (all other branches/PRs)

### Environment Variables - Production

Go to Project Settings → **Environment Variables** → Select **Production**

```env
# Supabase Configuration
SUPABASE_URL=https://wcafvfhvgjjijwxlgdzy.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

NEXT_PUBLIC_SUPABASE_URL=https://wcafvfhvgjjijwxlgdzy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# CORS - Production Web App URL
NEXT_PUBLIC_WEB_URL=https://inspectos.co

# DO NOT SET - These should NOT exist in production:
# ❌ BYPASS_AUTH
# ❌ NEXT_PUBLIC_IS_DEV_DEPLOYMENT
# ❌ SUPABASE_TENANT_ID
```

### Environment Variables - Preview

Go to Project Settings → **Environment Variables** → Select **Preview**

```env
# Development Mode Flag (REQUIRED for dev-api.inspectos.co)
NEXT_PUBLIC_IS_DEV_DEPLOYMENT=true

# Supabase Configuration
SUPABASE_URL=https://wcafvfhvgjjijwxlgdzy.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

NEXT_PUBLIC_SUPABASE_URL=https://wcafvfhvgjjijwxlgdzy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# CORS - Development Web App URL
NEXT_PUBLIC_WEB_URL=https://dev.inspectos.co

# Development-only Settings
BYPASS_AUTH=true
SUPABASE_TENANT_ID=f54f7c28-2dc7-4bc3-9c23-0a1dca0bd4e3
```

---

## Update CORS Configuration

Update [apps/server/proxy.ts](apps/server/proxy.ts) to include production URLs:

```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://dev.inspectos.co',          // Development
  'https://inspectos.co',               // Production
  process.env.NEXT_PUBLIC_WEB_URL,      // Dynamic (prod or dev)
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null, // Preview deployments
].filter(Boolean);
```

---

## Deployment Workflow

### Automatic Deployment

**When you push to `main`:**
1. `inspectos-web` deploys to `inspectos.co` (Production env vars)
2. `inspectos-api` deploys to `api.inspectos.co` (Production env vars)
3. Both use real auth, no BYPASS_AUTH

**When you push to `develop` or create a PR:**
1. `inspectos-web` deploys to `dev.inspectos.co` (Preview env vars)
2. `inspectos-api` deploys to `dev-api.inspectos.co` (Preview env vars)
3. Both use BYPASS_AUTH for testing

### Manual Deployment

You can also trigger deployments manually in Vercel UI:
1. Go to project → **Deployments**
2. Click **three dots** on any deployment
3. Select **Redeploy**

---

## How Environment Detection Works

The code checks multiple conditions to enable development features:

```typescript
const IS_DEVELOPMENT =
  process.env.NODE_ENV === 'development' ||           // Local dev (localhost)
  process.env.VERCEL_ENV === 'preview' ||            // Vercel preview deployments
  process.env.NEXT_PUBLIC_IS_DEV_DEPLOYMENT === 'true'; // Custom dev domain (dev.inspectos.co)
```

### Security Guarantee

Even if `BYPASS_AUTH=true` is accidentally set in Production environment:
- `VERCEL_ENV` will be `"production"` (not `"preview"`)
- `NODE_ENV` will be `"production"` (not `"development"`)
- `NEXT_PUBLIC_IS_DEV_DEPLOYMENT` won't be set in Production
- **Result:** `IS_DEVELOPMENT = false` → BYPASS_AUTH ignored ✅

---

## Verification Checklist

### After Initial Deployment

#### Production (inspectos.co, api.inspectos.co)

- [ ] Web app loads at https://inspectos.co
- [ ] API responds at https://api.inspectos.co/api/health
- [ ] Login redirects to Supabase auth (no BYPASS_AUTH)
- [ ] API requests include real Bearer tokens
- [ ] CORS allows requests from inspectos.co
- [ ] Data loads correctly with proper tenant isolation

#### Development (dev.inspectos.co, dev-api.inspectos.co)

- [ ] Web app loads at https://dev.inspectos.co
- [ ] API responds at https://dev-api.inspectos.co/api/health
- [ ] BYPASS_AUTH is active (no login required)
- [ ] API requests work with 'bypass-token'
- [ ] CORS allows requests from dev.inspectos.co
- [ ] Data loads from hardcoded tenant ID
- [ ] All admin pages work without authentication

### Test Deployment

1. **Create a test branch:**
   ```bash
   git checkout -b test-deployment
   git push origin test-deployment
   ```

2. **Verify preview deployments:**
   - Check Vercel dashboard for both projects
   - Should see preview URLs (or dev.inspectos.co if configured)
   - Test that BYPASS_AUTH works

3. **Merge to main:**
   ```bash
   git checkout main
   git merge test-deployment
   git push origin main
   ```

4. **Verify production deployments:**
   - Check Vercel dashboard for both projects
   - Test that real auth is required
   - Verify BYPASS_AUTH does NOT work

---

## Troubleshooting

### CORS Errors

**Problem:** Browser shows CORS errors when web app calls API

**Solution:**
1. Check [proxy.ts](apps/server/proxy.ts) includes correct origins
2. Verify `NEXT_PUBLIC_WEB_URL` is set in API project
3. Check browser DevTools → Network → Look for OPTIONS requests
4. Ensure OPTIONS returns 204 with CORS headers

### BYPASS_AUTH Not Working in Dev

**Problem:** dev.inspectos.co requires login instead of bypassing auth

**Solution:**
1. Check `NEXT_PUBLIC_IS_DEV_DEPLOYMENT=true` is set in Preview environment
2. Verify `BYPASS_AUTH=true` is set in API Preview environment
3. Check `SUPABASE_TENANT_ID` is set in API Preview environment
4. Look at deployment logs for `IS_DEVELOPMENT` value

### Production Using BYPASS_AUTH

**Problem:** Production site doesn't require login (security issue!)

**Solution:**
1. Go to API project → Environment Variables → Production
2. **Delete** `BYPASS_AUTH` variable if it exists
3. **Delete** `NEXT_PUBLIC_IS_DEV_DEPLOYMENT` if it exists
4. Redeploy production
5. Verify `IS_DEVELOPMENT = false` in logs

### Data Not Loading

**Problem:** Pages load but show empty data

**Solution:**
1. Check Network tab for API calls
2. Verify API URL is correct (production vs dev)
3. Check feature flags are enabled (NEXT_PUBLIC_USE_EXTERNAL_API_*)
4. Look at API logs for errors
5. Verify tenant parameter is passed correctly

### Preview Deployment Goes to Wrong Domain

**Problem:** PR deployments go to random Vercel URLs instead of dev.inspectos.co

**Solution:**
- This is expected for PR previews
- Only assign `dev.inspectos.co` to a specific branch (like `develop`)
- Or manually assign preview domain in Vercel UI

---

## Cost Optimization

### Vercel Free Tier Limits

- 2 projects within free tier (Pro needed for more)
- Unlimited deployments
- 100 GB bandwidth/month
- 6,000 build minutes/month

### Tips

1. **Disable auto-deploy for feature branches** if hitting limits:
   - Settings → Git → Ignored Build Step
   - Only deploy from `main` and `develop`

2. **Use preview URLs** instead of custom domains for PR testing

3. **Clean up old deployments** periodically

---

## Next Steps

1. **Deploy both projects** following this guide
2. **Test thoroughly** using the verification checklist
3. **Set up monitoring** (optional):
   - Vercel Analytics
   - Error tracking (Sentry, etc.)
   - API response time monitoring

4. **Configure CI/CD** (optional):
   - Pre-deploy tests
   - Automatic E2E testing on preview deployments

5. **Update documentation** with actual domain URLs

---

## Summary

✅ **2 Vercel Projects:** One for web, one for API
✅ **Environment-based Config:** Different variables for Production vs Preview
✅ **Automatic Deployment:** Push to Git → Auto deploy to correct environment
✅ **Security First:** Production can never use BYPASS_AUTH
✅ **Development Ready:** dev.inspectos.co has auth bypass for testing

**One Git Push → Two Deployments → Correct Environment** 🚀
