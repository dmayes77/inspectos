import { createQuickCapture } from './api';

type PendingQuickCaptureRecord = {
  local_id: string;
  tenant_slug: string;
  note: string;
  captured_at: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number | null;
  image_blob: Blob;
  created_at: string;
  last_error: string | null;
};

type QueueDb = IDBDatabase;

type EnqueueInput = {
  tenantSlug: string;
  note: string;
  capturedAt: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  imageBlob: Blob;
};

const DB_NAME = 'inspectos-mobile-offline';
const DB_VERSION = 3;
const STORE_NAME = 'quick_capture_queue';
const INSPECTION_MUTATION_STORE_NAME = 'inspection_mutation_queue';

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('failed to fetch') || msg.includes('network') || msg.includes('timeout');
}

function openQueueDb(): Promise<QueueDb> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'local_id' });
        store.createIndex('tenant_created', ['tenant_slug', 'created_at'], { unique: false });
      }
      if (!db.objectStoreNames.contains(INSPECTION_MUTATION_STORE_NAME)) {
        const inspectionStore = db.createObjectStore(INSPECTION_MUTATION_STORE_NAME, { keyPath: 'local_id' });
        inspectionStore.createIndex('tenant_order_created', ['tenant_slug', 'order_id', 'created_at'], { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open offline queue DB'));
  });
}

function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise(async (resolve, reject) => {
    let db: QueueDb | null = null;
    try {
      db = await openQueueDb();
    } catch (error) {
      reject(error);
      return;
    }

    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.close();
      reject(new Error(`Missing IndexedDB store: ${STORE_NAME}`));
      return;
    }

    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = run(store);

    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error('Queue operation failed'));
    };
    tx.oncomplete = () => db?.close();
    tx.onerror = () => db?.close();
    tx.onabort = () => db?.close();
  });
}

export async function enqueueQuickCapture(input: EnqueueInput): Promise<PendingQuickCaptureRecord> {
  const record: PendingQuickCaptureRecord = {
    local_id: `local-${crypto.randomUUID()}`,
    tenant_slug: input.tenantSlug,
    note: input.note,
    captured_at: input.capturedAt,
    latitude: input.latitude,
    longitude: input.longitude,
    accuracy_meters: input.accuracyMeters,
    image_blob: input.imageBlob,
    created_at: new Date().toISOString(),
    last_error: null,
  };

  await withStore('readwrite', (store) => store.put(record));
  return record;
}

export async function listPendingQuickCaptures(tenantSlug: string): Promise<PendingQuickCaptureRecord[]> {
  const rows = await withStore<PendingQuickCaptureRecord[]>('readonly', (store) => store.getAll());
  return (rows ?? [])
    .filter((row) => row.tenant_slug === tenantSlug)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function removePendingQuickCapture(localId: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(localId));
}

export async function markPendingQuickCaptureError(localId: string, message: string): Promise<void> {
  const row = await withStore<PendingQuickCaptureRecord | undefined>('readonly', (store) => store.get(localId));
  if (!row) return;
  row.last_error = message;
  await withStore('readwrite', (store) => store.put(row));
}

export async function syncPendingQuickCaptures(tenantSlug: string): Promise<{ synced: number; stoppedByNetwork: boolean }> {
  const pending = await listPendingQuickCaptures(tenantSlug);
  if (pending.length === 0) {
    return { synced: 0, stoppedByNetwork: false };
  }

  let synced = 0;
  for (const row of pending) {
    try {
      const file = new File([row.image_blob], `quick-capture-${Date.now()}.jpg`, {
        type: row.image_blob.type || 'image/jpeg',
      });

      await createQuickCapture(tenantSlug, {
        file,
        note: row.note,
        captured_at: row.captured_at,
        latitude: row.latitude,
        longitude: row.longitude,
        accuracy_meters: row.accuracy_meters,
      });

      await removePendingQuickCapture(row.local_id);
      synced += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      await markPendingQuickCaptureError(row.local_id, message);
      if (isNetworkError(error)) {
        return { synced, stoppedByNetwork: true };
      }
    }
  }

  return { synced, stoppedByNetwork: false };
}

export type { PendingQuickCaptureRecord };
