/**
 * Jobs data layer
 * Handles job CRUD operations
 */

export interface Job {
  id: string;
  tenant_id: string;
  property_id: string;
  client_id: string | null;
  template_id: string;
  inspector_id: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  scheduled_time: string | null;
  duration_minutes: number;
  selected_service_ids: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  property?: Property;
  client?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company?: string | null;
  } | null;
  template?: {
    id: string;
    name: string;
    description?: string | null;
  };
  inspector?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url?: string | null;
  };
  inspections?: Array<{
    id: string;
    status: string;
    started_at: string | null;
    completed_at: string | null;
  }>;
}

export interface Property {
  id: string;
  tenant_id: string;
  client_id: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  property_type: 'residential' | 'commercial' | 'multi-family' | 'other';
  year_built: number | null;
  square_feet: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateJobInput {
  tenant_slug: string;
  property_id: string;
  client_id?: string | null;
  template_id: string;
  inspector_id: string;
  scheduled_date: string;
  scheduled_time?: string | null;
  duration_minutes?: number;
  selected_service_ids?: string[];
  notes?: string | null;
}

export interface UpdateJobInput {
  id: string;
  property_id?: string;
  client_id?: string | null;
  template_id?: string;
  inspector_id?: string;
  status?: Job['status'];
  scheduled_date?: string;
  scheduled_time?: string | null;
  duration_minutes?: number;
  selected_service_ids?: string[];
  notes?: string | null;
}

export interface JobFilters {
  status?: Job['status'];
  inspector_id?: string;
  from?: string;
  to?: string;
}

export async function fetchJobs(tenantSlug: string, filters?: JobFilters): Promise<Job[]> {
  const params = new URLSearchParams({ tenant: tenantSlug });

  if (filters?.status) params.append('status', filters.status);
  if (filters?.inspector_id) params.append('inspector_id', filters.inspector_id);
  if (filters?.from) params.append('from', filters.from);
  if (filters?.to) params.append('to', filters.to);

  const response = await fetch(`/api/admin/jobs?${params}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch jobs');
  }

  const result = await response.json();
  return result.data;
}

export async function fetchJobById(id: string): Promise<Job> {
  const response = await fetch(`/api/admin/jobs/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch job');
  }

  const result = await response.json();
  return result.data;
}

export async function createJob(input: CreateJobInput): Promise<Job> {
  const response = await fetch(`/api/admin/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create job');
  }

  const result = await response.json();
  return result.data;
}

export async function updateJob(input: UpdateJobInput): Promise<Job> {
  const { id, ...data } = input;
  const response = await fetch(`/api/admin/jobs/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update job');
  }

  const result = await response.json();
  return result.data;
}

export async function deleteJob(id: string): Promise<boolean> {
  const response = await fetch(`/api/admin/jobs/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to delete job');
  }

  return true;
}
