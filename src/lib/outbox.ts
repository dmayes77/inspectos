import { addToOfflineQueue, getOfflineQueue, removeFromOfflineQueue, type OfflineAction } from "@/services";
import { waitForConnection, getNetworkStatus } from "@/services";

export interface OutboxResult {
  success: boolean;
  error?: string;
}

export async function enqueueAction(action: Omit<OfflineAction, "id" | "timestamp">) {
  await addToOfflineQueue(action);
}

export async function processOutbox(processor: (action: OfflineAction) => Promise<OutboxResult>) {
  const online = await getNetworkStatus();
  if (!online.connected) return;

  const queue = await getOfflineQueue();
  for (const action of queue) {
    const result = await processor(action);
    if (result.success) {
      await removeFromOfflineQueue(action.id);
    } else {
      // simple backoff: keep in queue
      console.warn("Outbox action failed, will retry", action.id, result.error);
    }
  }
}

// Helper to run processor when network is back
export async function runOutboxWhenOnline(processor: (action: OfflineAction) => Promise<OutboxResult>) {
  await waitForConnection();
  await processOutbox(processor);
}
