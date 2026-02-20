import { badRequest, serverError, success } from '@/lib/supabase';
import { requirePermission, withAuth } from '@/lib/api/with-auth';
import type { SupabaseClient } from '@supabase/supabase-js';

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
  billing: {
    planCode: 'growth',
    planName: 'Growth',
    currency: 'USD',
    baseMonthlyPrice: 399,
    includedInspectors: 1,
    maxInspectors: 5,
    additionalInspectorPrice: 89,
  },
};

type TenantSettings = typeof defaultSettings;
type SettingsResponse = TenantSettings & {
  business: {
    businessId: string;
    inspectorSeatCount: number;
    inspectorBilling: {
      includedInspectors: number;
      maxInspectors: number;
      additionalInspectorPrice: number;
      billableAdditionalSeats: number;
      additionalSeatsMonthlyCharge: number;
      estimatedMonthlyTotal: number;
      overSeatLimitBy: number;
      currency: string;
    };
    apiKeyPreview: string;
    apiKeyLastRotatedAt: string | null;
  };
};

function getBillingConfig(settings: Partial<TenantSettings> | null | undefined) {
  const source = settings?.billing ?? {};
  const includedInspectors = Math.max(0, Number((source as { includedInspectors?: number }).includedInspectors ?? 1));
  const maxInspectors = Math.max(includedInspectors, Number((source as { maxInspectors?: number }).maxInspectors ?? 5));
  const additionalInspectorPrice = Math.max(0, Number((source as { additionalInspectorPrice?: number }).additionalInspectorPrice ?? 89));
  const baseMonthlyPrice = Math.max(0, Number((source as { baseMonthlyPrice?: number }).baseMonthlyPrice ?? 399));
  const currency = typeof (source as { currency?: string }).currency === 'string' && (source as { currency?: string }).currency
    ? (source as { currency: string }).currency
    : 'USD';
  return {
    includedInspectors,
    maxInspectors,
    additionalInspectorPrice,
    baseMonthlyPrice,
    currency,
  };
}

function computeInspectorBilling(
  inspectorSeatCount: number,
  config: ReturnType<typeof getBillingConfig>
) {
  const billableAdditionalSeats = Math.max(0, inspectorSeatCount - config.includedInspectors);
  const additionalSeatsMonthlyCharge = billableAdditionalSeats * config.additionalInspectorPrice;
  const estimatedMonthlyTotal = config.baseMonthlyPrice + additionalSeatsMonthlyCharge;
  const overSeatLimitBy = Math.max(0, inspectorSeatCount - config.maxInspectors);

  return {
    includedInspectors: config.includedInspectors,
    maxInspectors: config.maxInspectors,
    additionalInspectorPrice: config.additionalInspectorPrice,
    billableAdditionalSeats,
    additionalSeatsMonthlyCharge,
    estimatedMonthlyTotal,
    overSeatLimitBy,
    currency: config.currency,
  };
}

async function countInspectorSeats(serviceClient: SupabaseClient, tenantId: string) {
  const { count, error } = await serviceClient
    .from('tenant_members')
    .select('user_id, profiles!inner(id)', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('profiles.is_inspector', true);

  if (error) {
    return { inspectorSeatCount: 0, error };
  }

  return { inspectorSeatCount: count ?? 0, error: null };
}

/**
 * GET /api/admin/settings
 */
export const GET = withAuth(async ({ serviceClient, tenant, memberRole, memberPermissions }) => {
  const permissionCheck = requirePermission(
    memberRole,
    'view_settings',
    'You do not have permission to view settings',
    memberPermissions
  );
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

  const { inspectorSeatCount, error: seatCountError } = await countInspectorSeats(serviceClient, tenant.id);
  if (seatCountError) {
    return serverError('Failed to fetch inspector seat count', seatCountError);
  }
  const billingConfig = getBillingConfig(settings);
  const inspectorBilling = computeInspectorBilling(inspectorSeatCount, billingConfig);

  const response: SettingsResponse = {
    ...settings,
    business: {
      businessId: data?.business_id ?? '',
      inspectorSeatCount,
      inspectorBilling,
      apiKeyPreview: keyData?.key_prefix ? `${keyData.key_prefix}••••••••` : '',
      apiKeyLastRotatedAt: keyData?.created_at ?? null,
    },
  };

  return success(response);
});

/**
 * PUT /api/admin/settings
 */
export const PUT = withAuth(async ({ serviceClient, tenant, memberRole, memberPermissions, request }) => {
  const permissionCheck = requirePermission(
    memberRole,
    'edit_settings',
    'You do not have permission to update settings',
    memberPermissions
  );
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
    billing: { ...defaultSettings.billing, ...currentSettings.billing, ...updates.billing },
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

  const { inspectorSeatCount, error: seatCountError } = await countInspectorSeats(serviceClient, tenant.id);
  if (seatCountError) {
    return serverError('Failed to fetch inspector seat count', seatCountError);
  }
  const billingConfig = getBillingConfig(newSettings);
  const inspectorBilling = computeInspectorBilling(inspectorSeatCount, billingConfig);

  const response: SettingsResponse = {
    ...newSettings,
    business: {
      businessId: data?.business_id ?? '',
      inspectorSeatCount,
      inspectorBilling,
      apiKeyPreview: keyData?.key_prefix ? `${keyData.key_prefix}••••••••` : '',
      apiKeyLastRotatedAt: keyData?.created_at ?? null,
    },
  };

  return success(response);
});
