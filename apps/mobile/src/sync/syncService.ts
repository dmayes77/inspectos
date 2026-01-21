import { Network } from '@capacitor/network';
import { database } from '../db/database';
import { readBase64File, Directory } from '../services/storage';
import { outboxRepository, OutboxItem } from '../db/repositories/outbox';
import { jobsRepository } from '../db/repositories/jobs';
import { templatesRepository } from '../db/repositories/templates';
import { mediaRepository } from '../db/repositories/media';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  pendingChanges: number;
  pendingUploads: number;
  error: string | null;
}

type SyncListener = (state: SyncState) => void;

class SyncService {
  private accessToken: string | null = null;
  private tenantSlug: string | null = null;
  private tenantId: string | null = null;
  private isOnline = true;
  private isSyncing = false;
  private listeners: Set<SyncListener> = new Set();
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  private state: SyncState = {
    status: 'idle',
    lastSyncedAt: null,
    pendingChanges: 0,
    pendingUploads: 0,
    error: null
  };

  constructor() {
    this.setupNetworkListener();
  }

  /**
   * Initialize the sync service with auth credentials
   */
  async initialize(accessToken: string, tenantSlug: string): Promise<void> {
    this.accessToken = accessToken;
    this.tenantSlug = tenantSlug;
    await this.updateState();
  }

  /**
   * Set tenant ID after bootstrap
   */
  setTenantId(tenantId: string): void {
    this.tenantId = tenantId;
  }

  /**
   * Clear auth/tenant context (sign out or tenant switch)
   */
  clearCredentials(): void {
    this.accessToken = null;
    this.tenantSlug = null;
    this.tenantId = null;
    this.setState({ status: 'idle', error: null, lastSyncedAt: null });
  }

  /**
   * Subscribe to sync state changes
   */
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  /**
   * Start automatic background sync
   */
  startAutoSync(intervalMs = 30000): void {
    this.stopAutoSync();
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.sync().catch(console.error);
      }
    }, intervalMs);
  }

  /**
   * Stop automatic background sync
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Perform a full bootstrap sync (initial data download)
   */
  async bootstrap(): Promise<void> {
    if (!this.accessToken || !this.tenantSlug) {
      throw new Error('Sync service not initialized');
    }

    this.setState({ status: 'syncing', error: null });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/sync/bootstrap?tenant=${this.tenantSlug}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Bootstrap failed: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Bootstrap failed');
      }

      // Store tenant ID
      this.tenantId = result.data.tenant.id;

      // Process downloaded data
      await this.processBootstrapData(result.data);

      // Save sync timestamp
      await this.saveSyncState('bootstrap', result.synced_at);

      await this.updateState();
      this.setState({ status: 'idle', lastSyncedAt: result.synced_at });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bootstrap failed';
      this.setState({ status: 'error', error: message });
      throw error;
    }
  }

  /**
   * Perform incremental sync (push + pull)
   */
  async sync(): Promise<void> {
    if (!this.accessToken || !this.tenantSlug || !this.tenantId) {
      console.warn('[Sync] Not initialized, skipping');
      return;
    }

    if (this.isSyncing) {
      console.log('[Sync] Already syncing, skipping');
      return;
    }

    if (!this.isOnline) {
      console.log('[Sync] Offline, skipping');
      return;
    }

    this.isSyncing = true;
    this.setState({ status: 'syncing', error: null });

    try {
      // Push local changes first
      await this.pushChanges();

      // Then pull remote changes
      await this.pullChanges();

      // Upload pending media
      await this.uploadPendingMedia();

      await this.updateState();
      this.setState({ status: 'idle', lastSyncedAt: new Date().toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      this.setState({ status: 'error', error: message });
      console.error('[Sync] Error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Push pending changes to server
   */
  private async pushChanges(): Promise<void> {
    const pending = await outboxRepository.getPending(50);

    if (pending.length === 0) {
      return;
    }

    console.log(`[Sync] Pushing ${pending.length} changes`);

    const response = await fetch(`${API_BASE_URL}/api/sync/push`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenant_id: this.tenantId,
        items: pending.map(item => ({
          id: item.id,
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          operation: item.operation,
          payload: JSON.parse(item.payload),
          created_at: item.created_at
        }))
      })
    });

    if (!response.ok) {
      throw new Error(`Push failed: ${response.status}`);
    }

    const result = await response.json();

    // Mark successful items as synced
    for (const r of result.results) {
      if (r.success) {
        await outboxRepository.markSynced(r.id);
      } else {
        await outboxRepository.markFailed(r.id, r.error || 'Unknown error');
      }
    }

    console.log(`[Sync] Pushed: ${result.succeeded} succeeded, ${result.failed} failed`);
  }

  /**
   * Pull changes from server
   */
  private async pullChanges(): Promise<void> {
    // Get last sync time
    const syncState = await database.query<{ cursor: string }>(
      `SELECT cursor FROM sync_state WHERE entity_type = 'pull'`
    );
    const since = syncState[0]?.cursor;

    const url = new URL(`${API_BASE_URL}/api/sync/pull`);
    url.searchParams.set('tenant', this.tenantSlug!);
    if (since) {
      url.searchParams.set('since', since);
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Pull failed: ${response.status}`);
    }

    const result = await response.json();

    // Process pulled changes
    await this.processPullData(result.changes);

    // Save sync cursor
    await this.saveSyncState('pull', result.synced_at);
  }

  /**
   * Upload pending media files
   */
  private async uploadPendingMedia(): Promise<void> {
    const pending = await mediaRepository.getPendingUploads(5);
    const retryable = await mediaRepository.getRetryableUploads(5, 5);
    const toUpload = [...pending, ...retryable];

    if (toUpload.length === 0) {
      return;
    }

    console.log(`[Sync] Uploading ${toUpload.length} media files`);

    // Get signed URLs
    const signResponse = await fetch(`${API_BASE_URL}/api/uploads/sign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenant_id: this.tenantId,
        files: toUpload.map(m => ({
          id: m.id,
          file_name: m.file_name,
          mime_type: m.mime_type,
          file_size: m.file_size,
          inspection_id: m.inspection_id
        }))
      })
    });

    if (!signResponse.ok) {
      console.error('[Sync] Failed to get signed URLs');
      return;
    }

    const { signed_urls } = await signResponse.json();

    // Upload each file
    for (const signedUrl of signed_urls) {
      const media = toUpload.find(m => m.id === signedUrl.id);
      if (!media) continue;

      try {
        await mediaRepository.markUploading(media.id);

        // Read file and upload
        const fileData = await this.readLocalFile(media.local_path);

        const uploadResponse = await fetch(signedUrl.upload_url, {
          method: 'PUT',
          headers: {
            'Content-Type': media.mime_type
          },
          body: fileData
        });

        if (uploadResponse.ok) {
          await mediaRepository.markUploaded(media.id, signedUrl.public_url);
          console.log(`[Sync] Uploaded: ${media.file_name}`);
        } else {
          await mediaRepository.markFailed(media.id, `Upload failed: ${uploadResponse.status}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        await mediaRepository.markFailed(media.id, message);
      }
    }
  }

  /**
   * Process bootstrap data into local database
   */
  private async processBootstrapData(data: Record<string, unknown>): Promise<void> {
    await database.transaction(async () => {
      // Store user profile
      if (data.user) {
        const user = data.user as Record<string, unknown>;
        await database.run(
          `INSERT OR REPLACE INTO user_profile (id, tenant_id, email, full_name, role, avatar_url, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [user.id, (data.tenant as { id: string }).id, user.email, user.full_name, user.role, user.avatar_url, new Date().toISOString()]
        );
      }

      // Store templates
      const templates = data.templates as Array<{
        id: string;
        tenant_id: string;
        name: string;
        description: string | null;
        version: number;
        is_active: boolean;
        created_at: string;
        updated_at: string;
        template_sections?: Array<{
          id: string;
          template_id: string;
          name: string;
          description: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
          template_items?: Array<{
            id: string;
            section_id: string;
            name: string;
            description: string | null;
            item_type: string;
            options: string | null;
            is_required: boolean;
            sort_order: number;
            created_at: string;
            updated_at: string;
          }>;
        }>;
      }>;

      for (const template of templates || []) {
        await templatesRepository.upsertTemplate({
          id: template.id,
          tenant_id: template.tenant_id,
          name: template.name,
          description: template.description,
          version: template.version,
          is_active: template.is_active ? 1 : 0,
          created_at: template.created_at,
          updated_at: template.updated_at
        });

        for (const section of template.template_sections || []) {
          await templatesRepository.upsertSection({
            id: section.id,
            template_id: section.template_id,
            name: section.name,
            description: section.description,
            sort_order: section.sort_order,
            created_at: section.created_at,
            updated_at: section.updated_at
          });

          for (const item of section.template_items || []) {
            await templatesRepository.upsertItem({
              id: item.id,
              section_id: item.section_id,
              name: item.name,
              description: item.description,
              item_type: item.item_type as 'checkbox' | 'rating' | 'text' | 'number' | 'select' | 'photo',
              options: item.options,
              is_required: item.is_required ? 1 : 0,
              sort_order: item.sort_order,
              created_at: item.created_at,
              updated_at: item.updated_at
            });
          }
        }
      }

      // Store clients
      const clients = data.clients as Array<Record<string, unknown>>;
      for (const client of clients || []) {
        await database.run(
          `INSERT OR REPLACE INTO clients (id, tenant_id, name, email, phone, company, notes, created_at, updated_at, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [client.id, client.tenant_id, client.name, client.email, client.phone, client.company, client.notes, client.created_at, client.updated_at, new Date().toISOString()]
        );
      }

      // Store properties
      const properties = data.properties as Array<Record<string, unknown>>;
      for (const prop of properties || []) {
        await database.run(
          `INSERT OR REPLACE INTO properties (id, tenant_id, client_id, address_line1, address_line2, city, state, zip_code, property_type, year_built, square_feet, notes, created_at, updated_at, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [prop.id, prop.tenant_id, prop.client_id, prop.address_line1, prop.address_line2, prop.city, prop.state, prop.zip_code, prop.property_type, prop.year_built, prop.square_feet, prop.notes, prop.created_at, prop.updated_at, new Date().toISOString()]
        );
      }

      // Store jobs
      const jobs = data.jobs as Array<Record<string, unknown>>;
      for (const job of jobs || []) {
        await jobsRepository.upsert(job as Parameters<typeof jobsRepository.upsert>[0]);
      }

      // Store defect library
      const defects = data.defect_library as Array<Record<string, unknown>>;
      for (const defect of defects || []) {
        await database.run(
          `INSERT OR REPLACE INTO defect_library (id, tenant_id, category, name, description, severity, recommendation, created_at, updated_at, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [defect.id, defect.tenant_id, defect.category, defect.name, defect.description, defect.severity, defect.recommendation, defect.created_at, defect.updated_at, new Date().toISOString()]
        );
      }

      // Store services
      const services = data.services as Array<Record<string, unknown>>;
      for (const service of services || []) {
        await database.run(
          `INSERT OR REPLACE INTO services (id, tenant_id, name, description, category, price, duration_minutes, template_id, is_active, created_at, updated_at, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            service.id,
            service.tenant_id,
            service.name,
            service.description,
            service.category,
            service.price,
            service.duration_minutes,
            service.template_id,
            service.is_active ? 1 : 0,
            service.created_at,
            service.updated_at,
            new Date().toISOString()
          ]
        );
      }
    });

    console.log('[Sync] Bootstrap data processed');
  }

  /**
   * Process pull data into local database
   */
  private async processPullData(changes: Record<string, unknown[]>): Promise<void> {
    // Similar to bootstrap but only for changed items
    // This is a simplified version - you might want more sophisticated merge logic
    await this.processBootstrapData(changes);
  }

  /**
   * Read a local file (Capacitor Filesystem)
   */
  private async readLocalFile(path: string): Promise<Blob> {
    const data = await readBase64File(path, Directory.Data);
    if (!data) {
      throw new Error(`File not found: ${path}`);
    }

    return this.base64ToBlob(data);
  }

  private base64ToBlob(base64: string, mimeType = 'application/octet-stream'): Blob {
    const byteCharacters = atob(base64);
    const byteArrays: Uint8Array[] = [];
    const sliceSize = 1024;

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }

    return new Blob(byteArrays, { type: mimeType });
  }

  /**
   * Save sync state cursor
   */
  private async saveSyncState(entityType: string, cursor: string): Promise<void> {
    await database.run(
      `INSERT OR REPLACE INTO sync_state (entity_type, cursor, last_synced_at, updated_at)
       VALUES (?, ?, ?, ?)`,
      [entityType, cursor, cursor, new Date().toISOString()]
    );
  }

  /**
   * Update internal state from database
   */
  private async updateState(): Promise<void> {
    const pendingChanges = await outboxRepository.getPendingCount();
    const uploadStats = await mediaRepository.getUploadStats();
    const pendingUploads = uploadStats.pending + uploadStats.failed;

    this.state = {
      ...this.state,
      pendingChanges,
      pendingUploads
    };
    this.notifyListeners();
  }

  /**
   * Set state and notify listeners
   */
  private setState(partial: Partial<SyncState>): void {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  /**
   * Setup network status listener
   */
  private setupNetworkListener(): void {
    Network.addListener('networkStatusChange', (status) => {
      this.isOnline = status.connected;
      if (status.connected) {
        this.setState({ status: 'idle' });
        // Trigger sync when coming online
        this.sync().catch(console.error);
      } else {
        this.setState({ status: 'offline' });
      }
    });

    // Get initial status
    Network.getStatus().then((status) => {
      this.isOnline = status.connected;
      if (!status.connected) {
        this.setState({ status: 'offline' });
      }
    });
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return this.state;
  }

  /**
   * Check if currently online
   */
  getIsOnline(): boolean {
    return this.isOnline;
  }
}

// Singleton instance
export const syncService = new SyncService();
