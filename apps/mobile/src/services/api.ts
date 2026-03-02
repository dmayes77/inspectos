const rawApiBaseUrl = (import.meta.env.VITE_API_URL || '').trim();
const shouldUseRelativeApiInDev =
  import.meta.env.DEV &&
  (rawApiBaseUrl.length === 0 ||
    rawApiBaseUrl === 'http://localhost:4000' ||
    rawApiBaseUrl === 'http://127.0.0.1:4000');

const API_BASE_URL = shouldUseRelativeApiInDev ? '' : rawApiBaseUrl;

type ApiErrorPayload = {
  success?: boolean;
  error?: string | { message?: string };
};

type ApiUser = {
  id: string;
  email: string | null;
  avatar_url?: string | null;
};

type ApiTenant = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

export type MobileSessionPayload = {
  user: ApiUser;
  tenant: ApiTenant;
};

export type BootstrapPayload = {
  business: { id: string; name: string; slug: string };
  user: { id: string; email: string; full_name?: string | null };
  orders: Array<{
    id: string;
    order_number?: string | null;
    scheduled_date: string;
    scheduled_time?: string | null;
    status: string;
    inspector_id: string;
    property_id: string;
    client_id?: string | null;
    template_id?: string | null;
  }>;
  properties: Array<{
    id: string;
    address_line1: string;
    city: string;
    state: string;
    zip_code: string;
  }>;
  clients: Array<{ id: string; name: string }>;
};

export type MobileOrderDetailPayload = {
  order: {
    id: string;
    order_number?: string | null;
    status: string;
    scheduled_date: string;
    scheduled_time?: string | null;
    template_id?: string | null;
    property?: {
      id: string;
      address_line1?: string | null;
      address_line2?: string | null;
      city?: string | null;
      state?: string | null;
      zip_code?: string | null;
      property_type?: string | null;
    } | null;
    client?: {
      id: string;
      name?: string | null;
      email?: string | null;
      phone?: string | null;
    } | null;
  };
  template: {
    id: string;
    name: string;
    description?: string | null;
    sections: Array<{
      id: string;
      name: string;
      description?: string | null;
      sort_order?: number | null;
      items: Array<{
        id: string;
        name: string;
        description?: string | null;
        item_type?: string | null;
        options?: unknown;
        is_required?: boolean | null;
        sort_order?: number | null;
      }>;
    }>;
  } | null;
  answers: Array<Record<string, unknown>>;
  findings: Array<Record<string, unknown>>;
  signatures: Array<Record<string, unknown>>;
  media: Array<Record<string, unknown>>;
};

export type MobileProfilePayload = {
  id: string;
  email: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  bio?: string | null;
  social_facebook?: string | null;
  social_twitter?: string | null;
  social_linkedin?: string | null;
  social_instagram?: string | null;
  social_links?: string[] | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state_region?: string | null;
  country?: string | null;
  postal_code?: string | null;
  role?: string | null;
  permissions?: unknown;
};

export type UpdateMobileProfileInput = {
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  bio?: string;
  social_facebook?: string | null;
  social_twitter?: string | null;
  social_linkedin?: string | null;
  social_instagram?: string | null;
  social_links?: string[] | null;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state_region?: string;
  country?: string;
  postal_code?: string;
};

async function parseApiError(response: Response): Promise<string> {
  let payload: ApiErrorPayload | null = null;
  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = null;
  }
  if (typeof payload?.error === 'string') return payload.error;
  if (typeof payload?.error?.message === 'string') return payload.error.message;
  return `Request failed: ${response.status}`;
}

async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return (await response.json()) as T;
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return (await response.json()) as T;
}

async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return (await response.json()) as T;
}

export async function login(email: string, password: string): Promise<void> {
  const json = await apiPost<{ success?: boolean; error?: string }>('/api/auth/login', { email, password });
  if (!json?.success) {
    throw new Error(json?.error || 'Login failed');
  }
}

export async function logout(): Promise<void> {
  await apiPost('/api/auth/logout');
}

export async function requestPasswordReset(email: string): Promise<void> {
  const json = await apiPost<{ success?: boolean; error?: string | { message?: string } }>('/api/auth/forgot-password', {
    email,
  });
  if (!json?.success) {
    if (typeof json?.error === 'string') throw new Error(json.error);
    throw new Error(json?.error?.message || 'Password reset failed');
  }
}

export async function fetchMobileSession(): Promise<MobileSessionPayload> {
  const json = await apiGet<{ success?: boolean; data?: MobileSessionPayload; error?: string }>('/api/mobile/session');
  if (!json?.success || !json?.data) {
    throw new Error(json?.error || 'Session fetch failed');
  }
  return json.data;
}

export async function fetchBootstrap(tenantSlug: string): Promise<BootstrapPayload> {
  const json = await apiGet<{ success?: boolean; data?: BootstrapPayload; error?: string }>(
    `/api/sync/bootstrap?business=${encodeURIComponent(tenantSlug)}&scope=orders`
  );
  if (!json?.success || !json?.data) {
    throw new Error(json?.error || 'Bootstrap failed');
  }
  return json.data;
}

export async function fetchOrderDetail(tenantSlug: string, orderId: string): Promise<MobileOrderDetailPayload> {
  const json = await apiGet<{ success?: boolean; data?: MobileOrderDetailPayload; error?: string }>(
    `/api/mobile/orders/${encodeURIComponent(orderId)}?business=${encodeURIComponent(tenantSlug)}`
  );
  if (!json?.success || !json?.data) {
    throw new Error(json?.error || 'Order detail failed');
  }
  return json.data;
}

export async function fetchBranding(tenantSlug: string): Promise<{ primary?: string | null; secondary?: string | null }> {
  const json = await apiGet<{ data?: { branding?: { primaryColor?: string | null; secondaryColor?: string | null } } }>(
    `/api/mobile/branding?business=${encodeURIComponent(tenantSlug)}`
  );
  return {
    primary: json?.data?.branding?.primaryColor ?? null,
    secondary: json?.data?.branding?.secondaryColor ?? null,
  };
}

export async function fetchProfile(): Promise<MobileProfilePayload> {
  const json = await apiGet<{ success?: boolean; data?: MobileProfilePayload; error?: string }>('/api/admin/profile');
  if (!json?.success || !json?.data) {
    throw new Error(json?.error || 'Profile fetch failed');
  }
  return json.data;
}

export async function updateProfile(input: UpdateMobileProfileInput): Promise<MobileProfilePayload> {
  const json = await apiPut<{ success?: boolean; data?: MobileProfilePayload; error?: string }>('/api/admin/profile', input);
  if (!json?.success || !json?.data) {
    throw new Error(json?.error || 'Profile update failed');
  }
  return json.data;
}

export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/uploads/avatar`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  const json = (await response.json()) as { data?: { avatarUrl?: string } };
  const avatarUrl = json?.data?.avatarUrl;
  if (!avatarUrl) {
    throw new Error('Avatar upload failed');
  }
  return avatarUrl;
}
