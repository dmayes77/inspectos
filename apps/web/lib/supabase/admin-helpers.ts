// Helper function to get tenant ID for seed routes
// In production, this should be determined from the user's context
// For development/seeding, we use a hardcoded tenant ID
export function getTenantId(): string {
  // This is the default tenant ID for the seed data
  // In production, this would come from the authenticated user's session
  return process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'acme-inspections';
}
