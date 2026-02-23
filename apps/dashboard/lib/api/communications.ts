import type { CommunicationEntityType, CommunicationThread } from "@inspectos/shared/types/communication";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export async function fetchCommunicationThread(entityType: CommunicationEntityType, entityId: string): Promise<CommunicationThread> {
  const response = await fetch(`${API_BASE}/admin/communications/threads/${entityType}/${entityId}`, {
    credentials: "include",
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error?.message || "Failed to load communication thread");
  }
  const result = await response.json();
  return result.data as CommunicationThread;
}
