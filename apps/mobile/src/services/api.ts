import type {
  InspectionTransitionRequestPayload,
  InspectionTransitionResponsePayload,
} from '../../../../shared/types/inspection-state-machine';

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
    avatar_url?: string | null;
    image_url?: string | null;
    photo_url?: string | null;
    cover_image_url?: string | null;
    cover_photo_url?: string | null;
  }>;
  clients: Array<{ id: string; name: string }>;
};

export type MobileOrderDetailPayload = {
  order: {
    id: string;
    order_number?: string | null;
    status: string;
    source?: string | null;
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
      is_custom?: boolean;
      source_template_section_id?: string | null;
      sort_order?: number | null;
      items: Array<{
        id: string;
        name: string;
        description?: string | null;
        item_type?: string | null;
        options?: unknown;
        is_custom?: boolean;
        source_template_item_id?: string | null;
        source_section_id?: string | null;
        is_required?: boolean | null;
        sort_order?: number | null;
      }>;
    }>;
  } | null;
  answers: Array<Record<string, unknown>>;
  custom_answers?: Array<Record<string, unknown>>;
  findings: Array<Record<string, unknown>>;
  signatures: Array<Record<string, unknown>>;
  media: Array<Record<string, unknown>>;
  progress_summary?: {
    total_items: number;
    answered_count: number;
    custom_answered_count: number;
    findings_count: number;
    media_count: number;
  };
};

export type InspectionAnswerPayload = {
  id?: string;
  template_item_id: string;
  section_id: string;
  value?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type InspectionMediaPayload = {
  id: string;
  order_id: string;
  answer_id?: string | null;
  template_item_id?: string | null;
  file_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  image_url: string;
  captured_at?: string;
  latitude?: number;
  longitude?: number;
  accuracy_meters?: number | null;
};

export type InspectionCustomAnswerPayload = {
  id?: string;
  custom_item_id: string;
  value?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type CreateFieldIntakeOrderInput = {
  address_line1: string;
  city: string;
  state: string;
  zip_code: string;
  reason_code: 'emergency' | 'walk_up' | 'add_on' | 'after_hours' | 'other';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  contact_name?: string;
  tenant_phone?: string;
  notes?: string;
};

export type CreateFieldIntakeOrderPayload = {
  order_id: string;
  order_number?: string | null;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  schedule_id?: string | null;
  requires_dispatch_review: boolean;
  created_offline: boolean;
};

export type UpdateFieldIntakeOrderInput = {
  contact_name?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  zip_code?: string;
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

export type QuickCaptureMediaPayload = {
  id: string;
  name: string;
  note: string;
  captured_at: string;
  latitude: number;
  longitude: number;
  accuracy_meters?: number | null;
  storage_path: string;
  image_url: string;
  created_at: string;
};

export type ArrivalChecklistPayload = {
  safety_ready: boolean;
  safety_ppe: string;
  safety_notes: string;
  access_ready: boolean;
  access_method: string;
  access_notes: string;
  occupancy_logged: boolean;
  occupancy_status: string;
  occupancy_notes: string;
  utilities_logged: boolean;
  electricity_status: string;
  water_status: string;
  gas_status: string;
  utilities_notes: string;
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

async function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
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

async function apiPostForm<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
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

export async function getOrders(tenantSlug: string): Promise<BootstrapPayload> {
  const json = await apiGet<{ success?: boolean; data?: BootstrapPayload; error?: string }>(
    `/api/sync/bootstrap?business=${encodeURIComponent(tenantSlug)}&scope=orders`
  );
  if (!json?.success || !json?.data) {
    throw new Error(json?.error || 'Bootstrap failed');
  }
  return json.data;
}

export async function getOrder(
  tenantSlug: string,
  orderId: string,
  options?: { includeInspection?: boolean }
): Promise<MobileOrderDetailPayload> {
  const includeInspectionQuery = options?.includeInspection ? '&include=inspection' : '';
  const json = await apiGet<{ success?: boolean; data?: MobileOrderDetailPayload; error?: string }>(
    `/api/mobile/orders/${encodeURIComponent(orderId)}?business=${encodeURIComponent(tenantSlug)}${includeInspectionQuery}`
  );
  if (!json?.success || !json?.data) {
    throw new Error(json?.error || 'Order detail failed');
  }
  return json.data;
}

export async function createFieldIntakeOrder(
  tenantSlug: string,
  input: CreateFieldIntakeOrderInput
): Promise<CreateFieldIntakeOrderPayload> {
  const json = await apiPost<{ success?: boolean; data?: CreateFieldIntakeOrderPayload; error?: string | { message?: string } }>(
    `/api/mobile/orders/field-intake?business=${encodeURIComponent(tenantSlug)}`,
    input
  );

  if (!json?.success || !json?.data) {
    if (typeof json?.error === 'string') {
      throw new Error(json.error);
    }
    throw new Error(json?.error?.message || 'Field intake creation failed');
  }

  return json.data;
}

export async function transitionOrderInspectionState(
  tenantSlug: string,
  orderId: string,
  input: InspectionTransitionRequestPayload
): Promise<InspectionTransitionResponsePayload> {
  const json = await apiPost<{
    success?: boolean;
    data?: InspectionTransitionResponsePayload;
    error?: string | { message?: string };
  }>(
    `/api/mobile/orders/${encodeURIComponent(orderId)}/transition?business=${encodeURIComponent(tenantSlug)}`,
    input
  );

  if (!json?.success || !json?.data) {
    if (typeof json?.error === 'string') {
      throw new Error(json.error);
    }
    throw new Error(json?.error?.message || 'Order transition failed');
  }

  return json.data;
}

export async function updateFieldIntakeOrder(
  tenantSlug: string,
  orderId: string,
  input: UpdateFieldIntakeOrderInput
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/mobile/orders/${encodeURIComponent(orderId)}/field-intake?business=${encodeURIComponent(tenantSlug)}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }
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

export async function fetchQuickCaptures(tenantSlug: string): Promise<QuickCaptureMediaPayload[]> {
  const json = await apiGet<{ success?: boolean; data?: { items?: QuickCaptureMediaPayload[] }; error?: string }>(
    `/api/mobile/quick-captures?business=${encodeURIComponent(tenantSlug)}`
  );

  if (!json?.success || !json?.data?.items) {
    throw new Error(json?.error || 'Quick capture fetch failed');
  }

  return json.data.items;
}

export async function fetchQuickCaptureById(tenantSlug: string, captureId: string): Promise<QuickCaptureMediaPayload> {
  const json = await apiGet<{ success?: boolean; data?: { item?: QuickCaptureMediaPayload }; error?: string }>(
    `/api/mobile/quick-captures/${encodeURIComponent(captureId)}?business=${encodeURIComponent(tenantSlug)}`
  );

  if (!json?.success || !json?.data?.item) {
    throw new Error(json?.error || 'Quick capture detail fetch failed');
  }

  return json.data.item;
}

export async function createQuickCapture(
  tenantSlug: string,
  input: {
    file: File;
    note: string;
    captured_at: string;
    latitude: number;
    longitude: number;
    accuracy_meters?: number | null;
  }
): Promise<QuickCaptureMediaPayload> {
  const formData = new FormData();
  formData.append('file', input.file);
  formData.append('note', input.note);
  formData.append('captured_at', input.captured_at);
  formData.append('latitude', String(input.latitude));
  formData.append('longitude', String(input.longitude));
  if (input.accuracy_meters != null) {
    formData.append('accuracy_meters', String(input.accuracy_meters));
  }

  const json = await apiPostForm<{ success?: boolean; data?: { item?: QuickCaptureMediaPayload }; error?: string }>(
    `/api/mobile/quick-captures?business=${encodeURIComponent(tenantSlug)}`,
    formData
  );

  if (!json?.success || !json?.data?.item) {
    throw new Error(json?.error || 'Quick capture create failed');
  }

  return json.data.item;
}

export async function getOrderArrivalChecklist(
  tenantSlug: string,
  orderId: string
): Promise<{ checklist: ArrivalChecklistPayload; updated_at: string } | null> {
  const json = await apiGet<{
    success?: boolean;
    data?: { item?: { checklist?: ArrivalChecklistPayload; updated_at?: string } | null };
    error?: string;
  }>(
    `/api/mobile/orders/${encodeURIComponent(orderId)}/arrival-checklist?business=${encodeURIComponent(tenantSlug)}`
  );

  if (!json?.success) {
    throw new Error(json?.error || 'Arrival checklist fetch failed');
  }

  const item = json.data?.item;
  if (!item?.checklist || !item.updated_at) {
    return null;
  }

  return {
    checklist: item.checklist,
    updated_at: item.updated_at,
  };
}

export async function saveOrderArrivalChecklist(
  tenantSlug: string,
  orderId: string,
  checklist: ArrivalChecklistPayload
): Promise<{ checklist: ArrivalChecklistPayload; updated_at: string }> {
  const json = await apiPut<{
    success?: boolean;
    data?: { item?: { checklist?: ArrivalChecklistPayload; updated_at?: string } };
    error?: string;
  }>(
    `/api/mobile/orders/${encodeURIComponent(orderId)}/arrival-checklist?business=${encodeURIComponent(tenantSlug)}`,
    { checklist }
  );

  if (!json?.success || !json.data?.item?.checklist || !json.data?.item?.updated_at) {
    throw new Error(json?.error || 'Arrival checklist save failed');
  }

  return {
    checklist: json.data.item.checklist,
    updated_at: json.data.item.updated_at,
  };
}

export async function getOrderInspectionAnswers(
  tenantSlug: string,
  orderId: string
): Promise<InspectionAnswerPayload[]> {
  const json = await apiGet<{
    success?: boolean;
    data?: { items?: InspectionAnswerPayload[] };
    error?: string;
  }>(
    `/api/mobile/orders/${encodeURIComponent(orderId)}/inspection-data?business=${encodeURIComponent(tenantSlug)}`
  );

  if (!json?.success) {
    throw new Error(json?.error || 'Inspection answers fetch failed');
  }

  return json?.data?.items ?? [];
}

export async function saveOrderInspectionAnswers(
  tenantSlug: string,
  orderId: string,
  answers: InspectionAnswerPayload[]
): Promise<InspectionAnswerPayload[]> {
  const json = await apiPut<{
    success?: boolean;
    data?: { items?: InspectionAnswerPayload[] };
    error?: string;
  }>(
    `/api/mobile/orders/${encodeURIComponent(orderId)}/inspection-data?business=${encodeURIComponent(tenantSlug)}`,
    { answers }
  );

  if (!json?.success) {
    throw new Error(json?.error || 'Inspection answers save failed');
  }

  return json?.data?.items ?? [];
}

export async function getOrderInspectionMedia(
  tenantSlug: string,
  orderId: string,
  templateItemId?: string
): Promise<InspectionMediaPayload[]> {
  const query = templateItemId ? `&template_item_id=${encodeURIComponent(templateItemId)}` : '';
  const json = await apiGet<{
    success?: boolean;
    data?: { items?: InspectionMediaPayload[] };
    error?: string;
  }>(
    `/api/mobile/orders/${encodeURIComponent(orderId)}/inspection-media?business=${encodeURIComponent(tenantSlug)}${query}`
  );

  if (!json?.success) {
    throw new Error(json?.error || 'Inspection media fetch failed');
  }

  return json?.data?.items ?? [];
}

export async function createOrderInspectionMedia(
  tenantSlug: string,
  orderId: string,
  input: {
    file: File;
    template_item_id: string;
    section_id: string;
    captured_at: string;
    latitude: number;
    longitude: number;
    accuracy_meters?: number | null;
  }
): Promise<InspectionMediaPayload> {
  const formData = new FormData();
  formData.append('file', input.file);
  formData.append('template_item_id', input.template_item_id);
  formData.append('section_id', input.section_id);
  formData.append('captured_at', input.captured_at);
  formData.append('latitude', String(input.latitude));
  formData.append('longitude', String(input.longitude));
  if (input.accuracy_meters != null) {
    formData.append('accuracy_meters', String(input.accuracy_meters));
  }

  const json = await apiPostForm<{
    success?: boolean;
    data?: { item?: InspectionMediaPayload };
    error?: string;
  }>(
    `/api/mobile/orders/${encodeURIComponent(orderId)}/inspection-media?business=${encodeURIComponent(tenantSlug)}`,
    formData
  );

  if (!json?.success || !json?.data?.item) {
    throw new Error(json?.error || 'Inspection media upload failed');
  }

  return json.data.item;
}

export async function getOrderInspectionDetail(tenantSlug: string, orderId: string): Promise<MobileOrderDetailPayload> {
  return getOrder(tenantSlug, orderId, { includeInspection: true });
}

export async function createInspectionCustomSection(
  tenantSlug: string,
  orderId: string,
  input: {
    name: string;
  }
): Promise<{ id: string; name: string; sort_order?: number | null; created_at?: string }> {
  const json = await apiPost<{
    success?: boolean;
    data?: { section?: { id: string; name: string; sort_order?: number | null; created_at?: string } };
    error?: string;
  }>(
    `/api/mobile/orders/${encodeURIComponent(orderId)}/inspection-outline?business=${encodeURIComponent(tenantSlug)}`,
    {
      type: 'section',
      name: input.name,
    }
  );

  if (!json?.success || !json?.data?.section) {
    throw new Error(json?.error || 'Failed to create custom section');
  }

  return json.data.section;
}

export async function createInspectionCustomItem(
  tenantSlug: string,
  orderId: string,
  input: {
    section_id: string;
    name: string;
    description?: string | null;
    item_type?: string | null;
    is_required?: boolean;
  }
): Promise<{
  id: string;
  section_id: string;
  name: string;
  description?: string | null;
  item_type?: string | null;
  options?: unknown;
  is_required?: boolean | null;
  sort_order?: number | null;
}> {
  const json = await apiPost<{
    success?: boolean;
    data?: {
      item?: {
        id: string;
        section_id: string;
        name: string;
        description?: string | null;
        item_type?: string | null;
        options?: unknown;
        is_required?: boolean | null;
        sort_order?: number | null;
      };
    };
    error?: string;
  }>(
    `/api/mobile/orders/${encodeURIComponent(orderId)}/inspection-outline?business=${encodeURIComponent(tenantSlug)}`,
    {
      type: 'item',
      section_id: input.section_id,
      name: input.name,
      description: input.description ?? null,
      item_type: input.item_type ?? 'text',
      is_required: Boolean(input.is_required),
    }
  );

  if (!json?.success || !json?.data?.item) {
    throw new Error(json?.error || 'Failed to create custom item');
  }

  return json.data.item;
}

export async function removeInspectionOutlineSection(tenantSlug: string, orderId: string, sectionId: string): Promise<void> {
  const json = await apiDelete<{ success?: boolean; error?: string }>(
    `/api/mobile/orders/${encodeURIComponent(orderId)}/inspection-outline?business=${encodeURIComponent(tenantSlug)}`,
    {
      type: 'remove_section',
      section_id: sectionId,
    }
  );

  if (!json?.success) {
    throw new Error(json?.error || 'Failed to remove section');
  }
}

export async function removeInspectionOutlineItem(tenantSlug: string, orderId: string, itemId: string): Promise<void> {
  const json = await apiDelete<{ success?: boolean; error?: string }>(
    `/api/mobile/orders/${encodeURIComponent(orderId)}/inspection-outline?business=${encodeURIComponent(tenantSlug)}`,
    {
      type: 'remove_item',
      item_id: itemId,
    }
  );

  if (!json?.success) {
    throw new Error(json?.error || 'Failed to remove item');
  }
}

export async function saveInspectionCustomAnswers(
  tenantSlug: string,
  orderId: string,
  answers: InspectionCustomAnswerPayload[]
): Promise<InspectionCustomAnswerPayload[]> {
  const json = await apiPut<{
    success?: boolean;
    data?: { items?: InspectionCustomAnswerPayload[] };
    error?: string;
  }>(
    `/api/mobile/orders/${encodeURIComponent(orderId)}/inspection-custom-answers?business=${encodeURIComponent(tenantSlug)}`,
    { answers }
  );

  if (!json?.success) {
    throw new Error(json?.error || 'Inspection custom answers save failed');
  }

  return json?.data?.items ?? [];
}
