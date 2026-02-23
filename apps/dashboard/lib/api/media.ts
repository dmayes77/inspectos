const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

type ApiErrorPayload = {
  error?: string | { message?: string };
};

function getErrorMessage(payload: ApiErrorPayload, fallback: string): string {
  if (typeof payload.error === "string" && payload.error.trim()) return payload.error;
  if (
    payload.error &&
    typeof payload.error === "object" &&
    typeof payload.error.message === "string" &&
    payload.error.message.trim()
  ) {
    return payload.error.message;
  }
  return fallback;
}

export async function uploadAgentAvatar(formData: FormData): Promise<{ avatarUrl: string }> {
  const response = await fetch(`${API_BASE}/admin/agents/avatar`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  const payload = (await response.json().catch(() => ({}))) as { avatarUrl?: string } & ApiErrorPayload;
  if (!response.ok || !payload.avatarUrl) {
    throw new Error(getErrorMessage(payload, "Failed to upload profile photo."));
  }
  return { avatarUrl: payload.avatarUrl };
}

export async function deleteAgentAvatar(url: string): Promise<void> {
  const response = await fetch(`${API_BASE}/admin/agents/avatar`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
    credentials: "include",
  });
  const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Failed to remove profile photo."));
  }
}

export async function uploadBrandLogo(formData: FormData): Promise<{ logoUrl: string }> {
  const response = await fetch(`${API_BASE}/admin/settings/logo`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  const payload = (await response.json().catch(() => ({}))) as { logoUrl?: string } & ApiErrorPayload;
  if (!response.ok || !payload.logoUrl) {
    throw new Error(getErrorMessage(payload, "Upload failed"));
  }
  return { logoUrl: payload.logoUrl };
}

export async function deleteBrandLogo(): Promise<void> {
  const response = await fetch(`${API_BASE}/admin/settings/logo`, {
    method: "DELETE",
    credentials: "include",
  });
  const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Failed to remove logo"));
  }
}

export async function uploadCurrentUserAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(`${API_BASE}/uploads/avatar`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const payload = (await response.json().catch(() => ({}))) as { data?: { avatarUrl?: string } } & ApiErrorPayload;
  if (!response.ok || !payload.data?.avatarUrl) {
    throw new Error(getErrorMessage(payload, "Upload failed"));
  }
  return { avatarUrl: payload.data.avatarUrl };
}
