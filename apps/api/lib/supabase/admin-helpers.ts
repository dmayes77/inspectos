/**
 * TEMPORARY IMPLEMENTATION
 *
 * TODO: These upload routes need to be refactored to follow the same
 * authentication pattern as other admin API routes:
 * 1. Get access token from Authorization header
 * 2. Validate user with getUserFromToken()
 * 3. Get tenant from request query params
 * 4. Use resolveTenant() to validate tenant access
 *
 * For now, this returns a hardcoded tenant ID to allow builds to succeed.
 */

/**
 * @deprecated This function needs to be refactored.
 * Upload routes should receive tenant ID from authenticated request context.
 */
export function getTenantId(): string {
  // This is a placeholder implementation
  // In production, tenant ID should come from authenticated request context
  const tenantId = process.env.DEFAULT_TENANT_ID;

  if (!tenantId) {
    throw new Error(
      'getTenantId() called but DEFAULT_TENANT_ID not set. ' +
      'Upload routes need to be refactored to use proper authentication.'
    );
  }

  return tenantId;
}
