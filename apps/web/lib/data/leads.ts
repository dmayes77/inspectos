export type LeadRecord = {
  leadId: string;
  name: string;
  email: string;
  phone: string;
  stage: string;
  source: string;
  notes: string;
  serviceName: string;
  requestedDate: string;
  estimatedValue: number;
};

export async function fetchLeads(): Promise<LeadRecord[]> {
  const response = await fetch("/api/admin/leads");
  if (!response.ok) {
    throw new Error("Failed to load leads.");
  }
  const result = await response.json();
  return result.data;
}

export async function fetchLeadById(leadId: string): Promise<LeadRecord | null> {
  const response = await fetch(`/api/admin/leads/${leadId}`);
  if (!response.ok) {
    return null;
  }
  const result = await response.json();
  return result.data;
}

export async function createLead(data: Partial<LeadRecord>): Promise<LeadRecord> {
  const response = await fetch("/api/admin/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Failed to create lead.");
  }
  const result = await response.json();
  return result.data;
}

export async function updateLeadById(data: { leadId: string } & Partial<LeadRecord>): Promise<LeadRecord | null> {
  const response = await fetch(`/api/admin/leads/${data.leadId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Failed to update lead.");
  }
  const result = await response.json();
  return result.data;
}

export async function deleteLeadById(leadId: string): Promise<boolean> {
  const response = await fetch(`/api/admin/leads/${leadId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error ?? "Failed to delete lead.");
  }
  const result = await response.json();
  return result.data;
}
