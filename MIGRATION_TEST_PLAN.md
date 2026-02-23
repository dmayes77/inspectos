# API Migration Testing Plan

## Overview
All API routes have been migrated from `apps/web/app/api/admin` to `apps/server/app/api/admin`.
This document outlines how to test the migration.

## Prerequisites

1. **Start both servers:**
   ```bash
   # Terminal 1: Web app (localhost:3000)
   cd apps/web && npm run dev

   # Terminal 2: Central API (localhost:4000)
   cd apps/server && npm run dev
   ```

2. **Environment variables set:**
   - `NEXT_PUBLIC_API_URL=http://localhost:4000/api`
   - `NEXT_PUBLIC_TENANT_SLUG=acme-inspections`

## Testing Checklist

### Core Entities (Already Migrated Previously)
- [ ] **Leads**: List, create, update, delete
- [ ] **Clients**: List, create, update, delete
- [ ] **Services**: List, create, update, delete
- [ ] **Properties**: List, create, update, delete
- [ ] **Agencies**: List, create, update, delete
- [ ] **Agents**: List, create, update, delete
- [ ] **Orders**: List, create, update, delete, notes
- [ ] **Inspections**: List, create, update, delete, data
- [ ] **Invoices**: List, create, update, delete

### Newly Migrated Entities (Test These!)

#### 1. Communications
- [ ] GET `/api/admin/communications/threads/client/[id]`
- [ ] GET `/api/admin/communications/threads/agent/[id]`
- [ ] Verify mock data returns correctly

#### 2. Inspection Services
- [ ] PATCH `/api/admin/inspection-services/[id]` - Assign inspector/vendor
- [ ] PATCH `/api/admin/inspection-services/batch` - Batch update

#### 3. Pay Rules
- [ ] GET `/api/admin/pay-rules` - List all pay rules

#### 4. Payments
- [ ] GET `/api/admin/payments` - List payments
- [ ] POST `/api/admin/payments` - Record new payment
- [ ] Verify order payment status updates

#### 5. Payouts
- [ ] GET `/api/admin/payouts` - List payouts
- [ ] GET `/api/admin/payouts?status=pending` - Filter by status

#### 6. Settings
- [ ] GET `/api/admin/settings` - Fetch tenant settings
- [ ] PUT `/api/admin/settings` - Update settings
- [ ] POST `/api/admin/settings/logo` - Upload logo (web route)

#### 7. Team
- [ ] GET `/api/admin/team` - List team members
- [ ] POST `/api/admin/team` - Add team member
- [ ] PUT `/api/admin/team/[id]` - Update member
- [ ] DELETE `/api/admin/team/[id]` - Remove member
- [ ] POST `/api/admin/team/[id]/avatar` - Upload avatar (web route)

#### 8. Templates
- [ ] GET `/api/admin/templates` - List templates
- [ ] POST `/api/admin/templates` - Create template stub
- [ ] GET `/api/admin/templates/[id]` - Get template details
- [ ] PUT `/api/admin/templates/[id]` - Update template
- [ ] DELETE `/api/admin/templates/[id]` - Deactivate template
- [ ] POST `/api/admin/templates/[id]/duplicate` - Duplicate template

#### 9. Workflow Runs
- [ ] GET `/api/admin/workflow-runs` - List workflow runs
- [ ] POST `/api/admin/workflow-runs/process` - Process workflow

#### 10. Workflows
- [ ] GET `/api/admin/workflows` - List workflows
- [ ] POST `/api/admin/workflows` - Create workflow
- [ ] GET `/api/admin/workflows/[id]` - Get workflow details
- [ ] PUT `/api/admin/workflows/[id]` - Update workflow
- [ ] DELETE `/api/admin/workflows/[id]` - Deactivate workflow

## Testing Methods

### 1. Manual UI Testing
Navigate to each admin page and perform CRUD operations:
- `/admin/team`
- `/admin/templates`
- `/admin/workflows`
- `/admin/settings`
- `/admin/payments`
- `/admin/payouts`

### 2. Browser DevTools
1. Open DevTools → Network tab
2. Perform operations
3. Verify requests go to `localhost:4000/api` (not `localhost:3000/api`)
4. Check for 200 status codes
5. Verify Bearer token in request headers
6. Verify `?tenant=acme-inspections` query parameter

### 3. API Testing (Postman/Thunder Client)
```bash
# Example: Get team members
GET http://localhost:4000/api/admin/team?tenant=acme-inspections
Authorization: Bearer YOUR_ACCESS_TOKEN

# Example: Create template
POST http://localhost:4000/api/admin/templates?tenant=acme-inspections
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "Test Template",
  "description": "Test",
  "action": "create_stub"
}
```

## Common Issues & Solutions

### Issue: 401 Unauthorized
**Cause**: Missing or invalid access token
**Solution**: Ensure Supabase auth is working, check token in request headers

### Issue: 400 Tenant not found
**Cause**: Missing tenant query parameter or invalid tenant slug
**Solution**: Add `?tenant=acme-inspections` to all requests

### Issue: Network errors / CORS
**Cause**: Central API server not running
**Solution**: Start server with `cd apps/server && npm run dev`

### Issue: 404 Not Found
**Cause**: Route not created in central API
**Solution**: Check route file exists in `apps/server/app/api/admin/`

## Success Criteria

✅ **Migration is successful when:**
1. All admin pages load without errors
2. All CRUD operations work correctly
3. No requests go to `localhost:3000/api/admin/*` (except seed, logo, avatar)
4. All requests include Bearer token authentication
5. Data is correctly filtered by tenant
6. No console errors in browser
7. Mobile app continues to work (uses same central API)

## Rollback Plan

If critical issues are found:
1. The migration is NOT easily reversible since web routes were deleted
2. You would need to:
   - Restore web routes from git history
   - Re-add feature flags to .env.local
   - Revert data layer changes

**Therefore: Test thoroughly before deploying to production!**

## Next Steps After Testing

1. ✅ Verify all functionality works locally
2. ✅ Deploy central API to staging
3. ✅ Deploy web app to staging
4. ✅ Test in staging environment
5. ✅ Monitor for 24-48 hours
6. ✅ Deploy to production
7. ✅ Monitor production metrics
8. ✅ Update documentation

## Monitoring Checklist

Watch for:
- [ ] API response times (should be < 500ms for most endpoints)
- [ ] Error rates (should be < 1%)
- [ ] Authentication failures
- [ ] Tenant isolation (users only see their tenant's data)
- [ ] Database query performance
- [ ] Memory usage on API server

---

## Need Help?

Issues? Check:
1. Server logs: `apps/server` console output
2. Browser console: Network tab + Console tab
3. Database: Check Supabase logs for query errors
4. Auth: Verify Supabase session is active
