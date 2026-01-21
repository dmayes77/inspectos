import { database, generateId, nowISO } from '../database';

export type OutboxOperation = 'upsert' | 'delete';

export interface OutboxItem {
  id: string;
  entity_type: string;
  entity_id: string;
  operation: OutboxOperation;
  payload: string;
  created_at: string;
  attempts: number;
  last_attempt_at: string | null;
  error: string | null;
  synced_at: string | null;
}

export interface OutboxEntry<T = unknown> {
  entityType: string;
  entityId: string;
  operation: OutboxOperation;
  payload: T;
}

export const outboxRepository = {
  /**
   * Add an item to the outbox for sync
   */
  async add<T>(entry: OutboxEntry<T>): Promise<string> {
    const id = generateId();
    await database.run(
      `INSERT INTO outbox (id, entity_type, entity_id, operation, payload, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, entry.entityType, entry.entityId, entry.operation, JSON.stringify(entry.payload), nowISO()]
    );
    return id;
  },

  /**
   * Get all pending (unsynced) items
   */
  async getPending(limit = 50): Promise<OutboxItem[]> {
    return database.query<OutboxItem>(
      `SELECT * FROM outbox
       WHERE synced_at IS NULL
       ORDER BY created_at ASC
       LIMIT ?`,
      [limit]
    );
  },

  /**
   * Get pending items by entity type
   */
  async getPendingByType(entityType: string, limit = 50): Promise<OutboxItem[]> {
    return database.query<OutboxItem>(
      `SELECT * FROM outbox
       WHERE synced_at IS NULL AND entity_type = ?
       ORDER BY created_at ASC
       LIMIT ?`,
      [entityType, limit]
    );
  },

  /**
   * Mark an item as synced
   */
  async markSynced(id: string): Promise<void> {
    await database.run(
      `UPDATE outbox SET synced_at = ? WHERE id = ?`,
      [nowISO(), id]
    );
  },

  /**
   * Mark an item as failed with error
   */
  async markFailed(id: string, error: string): Promise<void> {
    await database.run(
      `UPDATE outbox
       SET attempts = attempts + 1,
           last_attempt_at = ?,
           error = ?
       WHERE id = ?`,
      [nowISO(), error, id]
    );
  },

  /**
   * Delete synced items older than X days
   */
  async cleanupSynced(daysOld = 7): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysOld);

    const result = await database.run(
      `DELETE FROM outbox WHERE synced_at IS NOT NULL AND synced_at < ?`,
      [cutoff.toISOString()]
    );
    return result.changes;
  },

  /**
   * Get count of pending items
   */
  async getPendingCount(): Promise<number> {
    const result = await database.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM outbox WHERE synced_at IS NULL`
    );
    return result[0]?.count || 0;
  },

  /**
   * Get count of failed items (too many attempts)
   */
  async getFailedCount(maxAttempts = 5): Promise<number> {
    const result = await database.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM outbox
       WHERE synced_at IS NULL AND attempts >= ?`,
      [maxAttempts]
    );
    return result[0]?.count || 0;
  },

  /**
   * Retry failed items by resetting their attempt count
   */
  async retryFailed(): Promise<number> {
    const result = await database.run(
      `UPDATE outbox
       SET attempts = 0, error = NULL
       WHERE synced_at IS NULL AND attempts >= 5`
    );
    return result.changes;
  }
};
