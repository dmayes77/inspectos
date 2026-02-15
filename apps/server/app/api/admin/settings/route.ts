import { serverError, success } from '@/lib/supabase';
import { withAuth } from '@/lib/api/with-auth';

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

/**
 * GET /api/admin/settings
 */
export const GET = withAuth(async ({ supabase, tenant }) => {
  const { data, error } = await supabase
    .from('tenants')
    .select('settings, name')
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

  return success(settings);
});

/**
 * PUT /api/admin/settings
 */
export const PUT = withAuth(async ({ supabase, tenant, request }) => {
  const body = await request.json();
  const updates = body as Partial<TenantSettings>;

  // Get current settings
  const { data: current, error: fetchError } = await supabase
    .from('tenants')
    .select('settings')
    .eq('id', tenant.id)
    .single();

  if (fetchError) {
    return serverError('Failed to fetch current settings', fetchError);
  }

  // Deep merge settings
  const currentSettings = (current?.settings as Partial<TenantSettings>) || {};
  const newSettings: TenantSettings = {
    company: { ...defaultSettings.company, ...currentSettings.company, ...updates.company },
    branding: { ...defaultSettings.branding, ...currentSettings.branding, ...updates.branding },
    notifications: { ...defaultSettings.notifications, ...currentSettings.notifications, ...updates.notifications },
  };

  // Update tenant settings
  const { data, error } = await supabase
    .from('tenants')
    .update({ settings: newSettings })
    .eq('id', tenant.id)
    .select('settings')
    .single();

  if (error) {
    return serverError('Failed to update settings', error);
  }

  return success(data?.settings);
});
