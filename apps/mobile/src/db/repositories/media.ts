import { database, generateId, nowISO } from '../database';

export type UploadState = 'pending' | 'uploading' | 'uploaded' | 'failed';

export interface MediaAsset {
  id: string;
  inspection_id: string | null;
  finding_id: string | null;
  answer_id: string | null;
  local_path: string;
  remote_url: string | null;
  file_name: string;
  mime_type: string;
  file_size: number;
  sha256: string | null;
  caption: string | null;
  upload_state: UploadState;
  upload_attempts: number;
  last_upload_attempt: string | null;
  upload_error: string | null;
  created_at: string;
}

export interface CreateMediaInput {
  inspectionId?: string;
  findingId?: string;
  answerId?: string;
  localPath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sha256?: string;
  caption?: string;
}

export const mediaRepository = {
  /**
   * Create a media asset record
   */
  async create(input: CreateMediaInput): Promise<string> {
    const id = generateId();
    await database.run(
      `INSERT INTO media_assets (id, inspection_id, finding_id, answer_id, local_path,
                                 file_name, mime_type, file_size, sha256, caption,
                                 upload_state, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [
        id, input.inspectionId || null, input.findingId || null, input.answerId || null,
        input.localPath, input.fileName, input.mimeType, input.fileSize,
        input.sha256 || null, input.caption || null, nowISO()
      ]
    );
    return id;
  },

  /**
   * Get media asset by ID
   */
  async getById(id: string): Promise<MediaAsset | null> {
    const results = await database.query<MediaAsset>(
      `SELECT * FROM media_assets WHERE id = ?`,
      [id]
    );
    return results[0] || null;
  },

  /**
   * Get all media for an inspection
   */
  async getByInspection(inspectionId: string): Promise<MediaAsset[]> {
    return database.query<MediaAsset>(
      `SELECT * FROM media_assets WHERE inspection_id = ? ORDER BY created_at ASC`,
      [inspectionId]
    );
  },

  /**
   * Get all media for a finding
   */
  async getByFinding(findingId: string): Promise<MediaAsset[]> {
    return database.query<MediaAsset>(
      `SELECT * FROM media_assets WHERE finding_id = ? ORDER BY created_at ASC`,
      [findingId]
    );
  },

  /**
   * Get pending uploads
   */
  async getPendingUploads(limit = 10): Promise<MediaAsset[]> {
    return database.query<MediaAsset>(
      `SELECT * FROM media_assets
       WHERE upload_state = 'pending'
       ORDER BY created_at ASC
       LIMIT ?`,
      [limit]
    );
  },

  /**
   * Get failed uploads that can be retried
   */
  async getRetryableUploads(maxAttempts = 5, limit = 10): Promise<MediaAsset[]> {
    return database.query<MediaAsset>(
      `SELECT * FROM media_assets
       WHERE upload_state = 'failed' AND upload_attempts < ?
       ORDER BY last_upload_attempt ASC
       LIMIT ?`,
      [maxAttempts, limit]
    );
  },

  /**
   * Mark upload as started
   */
  async markUploading(id: string): Promise<void> {
    await database.run(
      `UPDATE media_assets
       SET upload_state = 'uploading',
           upload_attempts = upload_attempts + 1,
           last_upload_attempt = ?
       WHERE id = ?`,
      [nowISO(), id]
    );
  },

  /**
   * Mark upload as completed
   */
  async markUploaded(id: string, remoteUrl: string): Promise<void> {
    await database.run(
      `UPDATE media_assets
       SET upload_state = 'uploaded',
           remote_url = ?,
           upload_error = NULL
       WHERE id = ?`,
      [remoteUrl, id]
    );
  },

  /**
   * Mark upload as failed
   */
  async markFailed(id: string, error: string): Promise<void> {
    await database.run(
      `UPDATE media_assets
       SET upload_state = 'failed',
           upload_error = ?
       WHERE id = ?`,
      [error, id]
    );
  },

  /**
   * Reset failed uploads for retry
   */
  async resetForRetry(id: string): Promise<void> {
    await database.run(
      `UPDATE media_assets
       SET upload_state = 'pending',
           upload_error = NULL
       WHERE id = ?`,
      [id]
    );
  },

  /**
   * Update caption
   */
  async updateCaption(id: string, caption: string): Promise<void> {
    await database.run(
      `UPDATE media_assets SET caption = ? WHERE id = ?`,
      [caption, id]
    );
  },

  /**
   * Delete a media asset
   */
  async delete(id: string): Promise<void> {
    await database.run(`DELETE FROM media_assets WHERE id = ?`, [id]);
  },

  /**
   * Get upload stats
   */
  async getUploadStats(): Promise<{
    pending: number;
    uploading: number;
    uploaded: number;
    failed: number;
  }> {
    const results = await database.query<{ upload_state: UploadState; count: number }>(
      `SELECT upload_state, COUNT(*) as count FROM media_assets GROUP BY upload_state`
    );

    const stats = { pending: 0, uploading: 0, uploaded: 0, failed: 0 };
    for (const row of results) {
      stats[row.upload_state] = row.count;
    }
    return stats;
  },

  /**
   * Get total pending upload size
   */
  async getPendingUploadSize(): Promise<number> {
    const result = await database.query<{ total: number }>(
      `SELECT COALESCE(SUM(file_size), 0) as total
       FROM media_assets
       WHERE upload_state IN ('pending', 'failed')`
    );
    return result[0]?.total || 0;
  },

  /**
   * Delete orphaned media (no inspection, finding, or answer)
   */
  async cleanupOrphaned(): Promise<number> {
    const result = await database.run(
      `DELETE FROM media_assets
       WHERE inspection_id IS NULL
         AND finding_id IS NULL
         AND answer_id IS NULL`
    );
    return result.changes;
  }
};
