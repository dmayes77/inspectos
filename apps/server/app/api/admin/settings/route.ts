import { NextRequest } from 'next/server';
import {
  createUserClient,
  getAccessToken,
  getUserFromToken,
  unauthorized,
  badRequest,
  serverError,
  success
} from '@/lib/supabase';
import { resolveTenant } from '@/lib/tenants';

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
export async function GET(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const tenantSlug = request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

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
  } catch (error) {
    return serverError('Failed to fetch settings', error);
  }
}

/**
 * PUT /api/admin/settings
 */
export async function PUT(request: NextRequest) {
  try {
    const accessToken = getAccessToken(request);
    if (!accessToken) {
      return unauthorized('Missing access token');
    }

    const user = getUserFromToken(accessToken);
    if (!user) {
      return unauthorized('Invalid access token');
    }

    const body = await request.json();
    const updates = body as Partial<TenantSettings>;
    const { tenant_slug } = body;

    const tenantSlug = tenant_slug || request.nextUrl.searchParams.get('tenant');
    const supabase = createUserClient(accessToken);
    const { tenant, error: tenantError } = await resolveTenant(supabase, user.userId, tenantSlug);
    if (tenantError || !tenant) {
      return badRequest('Tenant not found');
    }

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
  } catch (error) {
    return serverError('Failed to update settings', error);
  }
}
