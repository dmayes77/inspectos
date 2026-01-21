export const getTenantId = () => {
  const tenantId = process.env.SUPABASE_TENANT_ID;
  if (!tenantId) {
    throw new Error("SUPABASE_TENANT_ID is required to scope admin data.");
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(tenantId)) {
    throw new Error(`SUPABASE_TENANT_ID must be a UUID. Got "${tenantId}".`);
  }
  return tenantId;
};
