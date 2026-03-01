import { badRequest, serverError, success } from '@/lib/supabase';
import { requirePermission, withAuth } from '@/lib/api/with-auth';
import type { SupabaseClient } from '@supabase/supabase-js';
import { syncStripeSeatQuantityForTenant } from '@/lib/billing/stripe-seat-sync';
import { normalizePhoneForStorage } from '@/lib/phone/normalize';

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
    baseMonthlyPrice: 499,
    includedInspectors: 1,
    inspectorSeatCount: 1,
    maxInspectors: 5,
    additionalInspectorPrice: 99,
    subscriptionStatus: 'trialing',
    trialEndsAt: null as string | null,
    stripeCurrentPeriodStart: null as string | null,
    stripeCurrentPeriodEnd: null as string | null,
    stripeCancelAtPeriodEnd: false,
  },
  onboarding: {
    dashboardWelcomeDismissedAt: null as string | null,
  },
};

type TenantSettings = typeof defaultSettings;
type SettingsResponse = TenantSettings & {
  business: {
    businessId: string;
    inspectorSeatCount: number; // seats currently assigned/in use
    inspectorBilling: {
      selectedInspectorSeats: number; // seats purchased/configured for billing
      usedInspectorSeats: number;
      remainingInspectorSeats: number;
      includedInspectors: number;
      maxInspectors: number;
      additionalInspectorPrice: number;
      billableAdditionalSeats: number;
      additionalSeatsMonthlyCharge: number;
      estimatedMonthlyTotal: number;
      overSeatLimitBy: number;
      overAssignedSeats: number;
      currency: string;
    };
    apiKeyPreview: string;
    apiKeyLastRotatedAt: string | null;
  };
  billingSeatSync?: {
    status: string;
    [key: string]: unknown;
  };
};

function getBillingConfig(settings: Partial<TenantSettings> | null | undefined) {
  const source = settings?.billing ?? {};
  const includedInspectors = Math.max(0, Number((source as { includedInspectors?: number }).includedInspectors ?? 1));
  const maxInspectors = Math.max(includedInspectors, Number((source as { maxInspectors?: number }).maxInspectors ?? 5));
  const additionalInspectorPrice = Math.max(0, Number((source as { additionalInspectorPrice?: number }).additionalInspectorPrice ?? 99));
  const baseMonthlyPrice = Math.max(0, Number((source as { baseMonthlyPrice?: number }).baseMonthlyPrice ?? 499));
  const configuredInspectorSeats = Math.max(
    includedInspectors,
    Number((source as { inspectorSeatCount?: number }).inspectorSeatCount ?? Number.NaN)
  );
  const stripeSeatQuantity = Math.max(0, Number((source as { stripeSeatQuantity?: number }).stripeSeatQuantity ?? Number.NaN));
  const selectedInspectorSeats = Number.isFinite(configuredInspectorSeats)
    ? configuredInspectorSeats
    : Number.isFinite(stripeSeatQuantity)
      ? includedInspectors + stripeSeatQuantity
      : includedInspectors;
  const currency = typeof (source as { currency?: string }).currency === 'string' && (source as { currency?: string }).currency
    ? (source as { currency: string }).currency
    : 'USD';
  return {
    selectedInspectorSeats,
    includedInspectors,
    maxInspectors,
    additionalInspectorPrice,
    baseMonthlyPrice,
    currency,
  };
}

function computeInspectorBilling(
  usedInspectorSeats: number,
  config: ReturnType<typeof getBillingConfig>
) {
  const selectedInspectorSeats = Math.max(config.includedInspectors, config.selectedInspectorSeats);
  const remainingInspectorSeats = Math.max(0, selectedInspectorSeats - usedInspectorSeats);
  const overAssignedSeats = Math.max(0, usedInspectorSeats - selectedInspectorSeats);
  const billableAdditionalSeats = Math.max(0, selectedInspectorSeats - config.includedInspectors);
  const additionalSeatsMonthlyCharge = billableAdditionalSeats * config.additionalInspectorPrice;
  const estimatedMonthlyTotal = config.baseMonthlyPrice + additionalSeatsMonthlyCharge;
  const overSeatLimitBy = Math.max(0, selectedInspectorSeats - config.maxInspectors);

  return {
    selectedInspectorSeats,
    usedInspectorSeats,
    remainingInspectorSeats,
    includedInspectors: config.includedInspectors,
    maxInspectors: config.maxInspectors,
    additionalInspectorPrice: config.additionalInspectorPrice,
    billableAdditionalSeats,
    additionalSeatsMonthlyCharge,
    estimatedMonthlyTotal,
    overSeatLimitBy,
    overAssignedSeats,
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
  const { inspectorSeatCount: usedInspectorSeatCount, error: usedSeatCountError } = await countInspectorSeats(serviceClient, tenant.id);
  if (usedSeatCountError) {
    return serverError('Failed to fetch inspector seat count', usedSeatCountError);
  }

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
  const currentBilling = (currentSettings.billing ?? defaultSettings.billing) as Partial<TenantSettings['billing']>;
  const newSettings: TenantSettings = {
    company: { ...defaultSettings.company, ...currentSettings.company, ...updates.company },
    branding: { ...defaultSettings.branding, ...currentSettings.branding, ...updates.branding },
    notifications: { ...defaultSettings.notifications, ...currentSettings.notifications, ...updates.notifications },
    billing: { ...defaultSettings.billing, ...currentSettings.billing, ...updates.billing },
    onboarding: { ...defaultSettings.onboarding, ...currentSettings.onboarding, ...updates.onboarding },
  };

  newSettings.company.phone = normalizePhoneForStorage(newSettings.company.phone) ?? '';

  const requestedSeatCount = updates.billing
    ? Number((updates.billing as Partial<TenantSettings['billing']>).inspectorSeatCount)
    : Number.NaN;

  if (Number.isFinite(requestedSeatCount)) {
    const normalizedSeatCount = Math.round(requestedSeatCount);
    const includedInspectors = Math.max(0, Number(newSettings.billing.includedInspectors ?? defaultSettings.billing.includedInspectors));
    const maxInspectors = Math.max(includedInspectors, Number(newSettings.billing.maxInspectors ?? defaultSettings.billing.maxInspectors));

    if (normalizedSeatCount < includedInspectors || normalizedSeatCount > maxInspectors) {
      return badRequest(`Inspector seats must be between ${includedInspectors} and ${maxInspectors} for this plan.`);
    }

    if (normalizedSeatCount < usedInspectorSeatCount) {
      return badRequest(`Cannot set purchased seats below active inspector assignments (${usedInspectorSeatCount}).`);
    }

    newSettings.billing = {
      ...newSettings.billing,
      inspectorSeatCount: normalizedSeatCount,
    };
  }

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

  const nextBilling = (newSettings.billing ?? defaultSettings.billing) as Partial<TenantSettings['billing']>;
  const previousPurchasedSeats = Number(currentBilling.inspectorSeatCount ?? Number.NaN);
  const nextPurchasedSeats = Number(nextBilling.inspectorSeatCount ?? Number.NaN);
  const shouldSyncSeats =
    previousPurchasedSeats !== nextPurchasedSeats ||
    currentBilling.planCode !== nextBilling.planCode ||
    currentBilling.includedInspectors !== nextBilling.includedInspectors;

  const seatSync = shouldSyncSeats
    ? await syncStripeSeatQuantityForTenant(serviceClient, tenant.id)
    : { status: 'skipped', reason: 'No billing seat changes detected' };

  const { data: keyData } = await serviceClient
    .from('business_api_keys')
    .select('key_prefix, created_at')
    .eq('tenant_id', tenant.id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const billingConfig = getBillingConfig(newSettings);
  const inspectorBilling = computeInspectorBilling(usedInspectorSeatCount, billingConfig);

  const response: SettingsResponse = {
    ...newSettings,
    business: {
      businessId: data?.business_id ?? '',
      inspectorSeatCount: usedInspectorSeatCount,
      inspectorBilling,
      apiKeyPreview: keyData?.key_prefix ? `${keyData.key_prefix}••••••••` : '',
      apiKeyLastRotatedAt: keyData?.created_at ?? null,
    },
    billingSeatSync: seatSync,
  };

  return success(response);
});
