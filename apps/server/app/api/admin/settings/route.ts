import { badRequest, serverError, success } from '@/lib/supabase';
import { requirePermission, withAuth } from '@/lib/api/with-auth';

// Default settings structure
const defaultSettings = {
  company: {
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  },
  branding: {
    logoUrl: null as string | null,
    primaryColor: '#0066cc',
    secondaryColor: '#333333',
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    inspectionReminders: true,
    paymentReminders: true,
  },
};

type TenantSettings = typeof defaultSettings;
type SettingsResponse = TenantSettings & {
  business: {
    businessId: string;
    apiKeyPreview: string;
    apiKeyLastRotatedAt: string | null;
  };
};

/**
 * GET /api/admin/settings
 */
export const GET = withAuth(async ({ serviceClient, tenant, memberRole }) => {
  const permissionCheck = requirePermission(memberRole, 'view_settings', 'You do not have permission to view settings');
  if (permissionCheck) return permissionCheck;

  const { data, error } = await serviceClient
    .from('tenants')
    .select('settings, name, business_id')
    .eq('id', tenant.id)
    .single();

  if (error) {
    return serverError('Failed to fetch settings', error);
  }

  // Merge stored settings with defaults
  const settings: TenantSettings = {
    ...defaultSettings,
    ...(data?.settings as Partial<TenantSettings> || {}),
  };

  // Use tenant name as default if company name not set
  if (!settings.company.name && data?.name) {
    settings.company.name = data.name;
  }

  const { data: keyData } = await serviceClient
    .from('business_api_keys')
    .select('key_prefix, created_at')
    .eq('tenant_id', tenant.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const response: SettingsResponse = {
    ...settings,
    business: {
      businessId: data?.business_id ?? '',
      apiKeyPreview: keyData?.key_prefix ? `${keyData.key_prefix}••••••••` : '',
      apiKeyLastRotatedAt: keyData?.created_at ?? null,
    },
  };

  return success(response);
});

/**
 * PUT /api/admin/settings
 */
export const PUT = withAuth(async ({ serviceClient, tenant, memberRole, request }) => {
  const permissionCheck = requirePermission(memberRole, 'edit_settings', 'You do not have permission to update settings');
  if (permissionCheck) return permissionCheck;

  const body = await request.json();
  const updates = body as Partial<TenantSettings>;

  // Get current settings
  const { data: current, error: fetchError } = await serviceClient
    .from('tenants')
    .select('settings')
    .eq('id', tenant.id)
    .maybeSingle();

  if (fetchError) {
    return serverError('Failed to fetch current settings', fetchError);
  }

  if (!current) {
    return badRequest('Business not found');
  }

  // Deep merge settings
  const currentSettings = (current?.settings as Partial<TenantSettings>) || {};
  const newSettings: TenantSettings = {
    company: { ...defaultSettings.company, ...currentSettings.company, ...updates.company },
    branding: { ...defaultSettings.branding, ...currentSettings.branding, ...updates.branding },
    notifications: { ...defaultSettings.notifications, ...currentSettings.notifications, ...updates.notifications },
  };

  // Update tenant settings
  const { data, error } = await serviceClient
    .from('tenants')
    .update({ settings: newSettings })
    .eq('id', tenant.id)
    .select('settings, business_id')
    .maybeSingle();

  if (error) {
    return serverError('Failed to update settings', error);
  }

  if (!data) {
    return badRequest('Business not found');
  }

  const { data: keyData } = await serviceClient
    .from('business_api_keys')
    .select('key_prefix, created_at')
    .eq('tenant_id', tenant.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const response: SettingsResponse = {
    ...newSettings,
    business: {
      businessId: data?.business_id ?? '',
      apiKeyPreview: keyData?.key_prefix ? `${keyData.key_prefix}••••••••` : '',
      apiKeyLastRotatedAt: keyData?.created_at ?? null,
    },
  };

  return success(response);
});
