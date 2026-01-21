import { Filesystem, Directory } from '@capacitor/filesystem';

export interface SavedFile {
  path: string;
  uri: string;
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

export async function createDirectory(
  path: string,
  directory: Directory = Directory.Data
): Promise<void> {
  try {
    await Filesystem.mkdir({ path, directory, recursive: true });
  } catch {
    // Directory may already exist.
  }
}

export async function readBase64File(
  filename: string,
  directory: Directory = Directory.Data
): Promise<string | null> {
  try {
    const result = await Filesystem.readFile({ path: filename, directory });
    return result.data as string;
  } catch {
    return null;
  }
}

const PHOTOS_DIR = 'inspection-photos';

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

export { Directory };
