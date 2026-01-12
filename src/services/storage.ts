import { Preferences } from "@capacitor/preferences";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";

// =============================================================================
// KEY-VALUE STORAGE (Preferences)
// =============================================================================

export async function setItem(key: string, value: string): Promise<void> {
  await Preferences.set({ key, value });
}

export async function getItem(key: string): Promise<string | null> {
  const { value } = await Preferences.get({ key });
  return value;
}

export async function removeItem(key: string): Promise<void> {
  await Preferences.remove({ key });
}

export async function clearStorage(): Promise<void> {
  await Preferences.clear();
}

export async function getAllKeys(): Promise<string[]> {
  const { keys } = await Preferences.keys();
  return keys;
}

// =============================================================================
// JSON STORAGE HELPERS
// =============================================================================

export async function setJSON<T>(key: string, value: T): Promise<void> {
  await setItem(key, JSON.stringify(value));
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const value = await getItem(key);
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

// =============================================================================
// FILE STORAGE (Filesystem)
// =============================================================================

export interface SavedFile {
  path: string;
  uri: string;
}

export async function saveFile(
  filename: string,
  data: string,
  directory: Directory = Directory.Data
): Promise<SavedFile> {
  const result = await Filesystem.writeFile({
    path: filename,
    data,
    directory,
    encoding: Encoding.UTF8,
  });
  return { path: filename, uri: result.uri };
}

export async function saveBase64File(
  filename: string,
  base64Data: string,
  directory: Directory = Directory.Data
): Promise<SavedFile> {
  const result = await Filesystem.writeFile({
    path: filename,
    data: base64Data,
    directory,
  });
  return { path: filename, uri: result.uri };
}

export async function readFile(
  filename: string,
  directory: Directory = Directory.Data
): Promise<string | null> {
  try {
    const result = await Filesystem.readFile({
      path: filename,
      directory,
      encoding: Encoding.UTF8,
    });
    return result.data as string;
  } catch {
    return null;
  }
}

export async function readBase64File(
  filename: string,
  directory: Directory = Directory.Data
): Promise<string | null> {
  try {
    const result = await Filesystem.readFile({
      path: filename,
      directory,
    });
    return result.data as string;
  } catch {
    return null;
  }
}

export async function deleteFile(
  filename: string,
  directory: Directory = Directory.Data
): Promise<boolean> {
  try {
    await Filesystem.deleteFile({ path: filename, directory });
    return true;
  } catch {
    return false;
  }
}

export async function fileExists(
  filename: string,
  directory: Directory = Directory.Data
): Promise<boolean> {
  try {
    await Filesystem.stat({ path: filename, directory });
    return true;
  } catch {
    return false;
  }
}

export async function createDirectory(
  path: string,
  directory: Directory = Directory.Data
): Promise<void> {
  try {
    await Filesystem.mkdir({ path, directory, recursive: true });
  } catch {
    // Directory may already exist
  }
}

export async function listDirectory(
  path: string,
  directory: Directory = Directory.Data
): Promise<string[]> {
  try {
    const result = await Filesystem.readdir({ path, directory });
    return result.files.map((f) => f.name);
  } catch {
    return [];
  }
}

// =============================================================================
// INSPECTION PHOTO STORAGE
// =============================================================================

const PHOTOS_DIR = "inspection-photos";

export async function saveInspectionPhoto(
  inspectionId: string,
  photoId: string,
  base64Data: string
): Promise<SavedFile> {
  const path = `${PHOTOS_DIR}/${inspectionId}`;
  await createDirectory(path);
  return saveBase64File(`${path}/${photoId}.jpg`, base64Data);
}

export async function getInspectionPhoto(
  inspectionId: string,
  photoId: string
): Promise<string | null> {
  return readBase64File(`${PHOTOS_DIR}/${inspectionId}/${photoId}.jpg`);
}

export async function deleteInspectionPhoto(
  inspectionId: string,
  photoId: string
): Promise<boolean> {
  return deleteFile(`${PHOTOS_DIR}/${inspectionId}/${photoId}.jpg`);
}

export async function listInspectionPhotos(
  inspectionId: string
): Promise<string[]> {
  const files = await listDirectory(`${PHOTOS_DIR}/${inspectionId}`);
  return files.filter((f) => f.endsWith(".jpg")).map((f) => f.replace(".jpg", ""));
}

// =============================================================================
// OFFLINE QUEUE STORAGE
// =============================================================================

const OFFLINE_QUEUE_KEY = "offline-sync-queue";

export interface OfflineAction {
  id: string;
  type: "create" | "update" | "delete";
  entity: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export async function addToOfflineQueue(action: Omit<OfflineAction, "id" | "timestamp">): Promise<void> {
  const queue = await getOfflineQueue();
  queue.push({
    ...action,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  await setJSON(OFFLINE_QUEUE_KEY, queue);
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  return (await getJSON<OfflineAction[]>(OFFLINE_QUEUE_KEY)) ?? [];
}

export async function removeFromOfflineQueue(actionId: string): Promise<void> {
  const queue = await getOfflineQueue();
  const filtered = queue.filter((a) => a.id !== actionId);
  await setJSON(OFFLINE_QUEUE_KEY, filtered);
}

export async function clearOfflineQueue(): Promise<void> {
  await removeItem(OFFLINE_QUEUE_KEY);
}

// =============================================================================
// DRAFT INSPECTION STORAGE
// =============================================================================

const DRAFTS_KEY = "inspection-drafts";

export interface InspectionDraft {
  id: string;
  propertyId: string;
  data: Record<string, unknown>;
  lastModified: number;
}

export async function saveDraft(draft: Omit<InspectionDraft, "lastModified">): Promise<void> {
  const drafts = await getDrafts();
  const existing = drafts.findIndex((d) => d.id === draft.id);
  const updated = { ...draft, lastModified: Date.now() };

  if (existing >= 0) {
    drafts[existing] = updated;
  } else {
    drafts.push(updated);
  }

  await setJSON(DRAFTS_KEY, drafts);
}

export async function getDraft(id: string): Promise<InspectionDraft | null> {
  const drafts = await getDrafts();
  return drafts.find((d) => d.id === id) ?? null;
}

export async function getDrafts(): Promise<InspectionDraft[]> {
  return (await getJSON<InspectionDraft[]>(DRAFTS_KEY)) ?? [];
}

export async function deleteDraft(id: string): Promise<void> {
  const drafts = await getDrafts();
  await setJSON(DRAFTS_KEY, drafts.filter((d) => d.id !== id));
}

export { Directory };
