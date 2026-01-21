# InspectOS Offline Architecture

## Overview

InspectOS uses a **local-first** architecture where all inspection work happens against a local SQLite database on the device. Changes are synced to the server when connectivity is available.

```
┌─────────────────────────────────────────────────────────────┐
│                        Mobile App                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   UI/React  │───▶│  Repositories│───▶│   SQLite    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                   │            │
│         │                  ▼                   │            │
│         │           ┌─────────────┐            │            │
│         │           │   Outbox    │            │            │
│         │           └─────────────┘            │            │
│         │                  │                   │            │
│         ▼                  ▼                   │            │
│  ┌─────────────────────────────────────────────┘            │
│  │              Sync Service                                │
│  └──────────────────────┬───────────────────────────────────┤
│                         │                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼ (when online)
┌─────────────────────────────────────────────────────────────┐
│                     Next.js API                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ /sync/bootstrap│  │ /sync/push  │    │ /sync/pull  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                              │                              │
│                              ▼                              │
│                    ┌─────────────────┐                      │
│                    │    Supabase     │                      │
│                    │   (Postgres)    │                      │
│                    └─────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. SQLite Database (`src/db/`)

The local database stores all data needed for offline work:

**Sync Tables:**
- `outbox` - Queued changes waiting to sync
- `sync_state` - Last sync timestamps per entity type

**Reference Data (downloaded from server):**
- `templates` - Inspection templates
- `template_sections` - Template sections
- `template_items` - Checklist items
- `defect_library` - Canned defects/recommendations

**Job Data:**
- `jobs` - Scheduled inspections
- `properties` - Property details
- `clients` - Client contact info

**Inspection Data (created offline):**
- `inspections` - Inspection records
- `answers` - Checklist responses
- `findings` - Issues discovered
- `signatures` - Captured signatures
- `media_assets` - Photos and documents

### 2. Repositories (`src/db/repositories/`)

Type-safe data access layer:

```typescript
// Example: Save an answer
await inspectionsRepository.saveAnswer(
  inspectionId,
  templateItemId,
  sectionId,
  value,
  notes
);
// Automatically adds to outbox for sync
```

### 3. Sync Service (`src/sync/syncService.ts`)

Handles all sync operations:

- **Bootstrap**: Initial full download for offline use
- **Push**: Upload local changes to server
- **Pull**: Download remote changes
- **Media Upload**: Upload photos with retry logic

### 4. API Endpoints (`apps/api/app/api/sync/`)

- `GET /api/sync/bootstrap` - Download all data for offline
- `POST /api/sync/push` - Upload batched changes
- `GET /api/sync/pull` - Get changes since last sync
- `POST /api/uploads/sign` - Get signed URLs for media uploads

## Data Flow

### Starting an Inspection (Offline)

```
1. User taps "Start Inspection" on a job
   │
2. inspectionsRepository.create()
   ├── Creates inspection in SQLite
   └── Adds to outbox (entity_type: 'inspection', operation: 'upsert')
   │
3. jobsRepository.updateStatus('in_progress')
   └── Adds to outbox (entity_type: 'job_status')
   │
4. UI shows inspection form (reads from SQLite)
```

### Saving Answers (Offline)

```
1. User completes a checklist item
   │
2. inspectionsRepository.saveAnswer()
   ├── Upserts answer in SQLite
   └── Adds to outbox
   │
3. UI updates immediately (optimistic)
```

### Taking Photos (Offline)

```
1. User takes a photo
   │
2. Photo saved to device filesystem
   │
3. mediaRepository.create()
   ├── Creates media_asset record
   └── upload_state = 'pending'
   │
4. Photo displayed in UI (from local path)
```

### Sync Process (When Online)

```
1. Network detected / Manual sync triggered
   │
2. syncService.sync()
   │
   ├── PUSH: Send local changes
   │   ├── Get pending outbox items
   │   ├── POST /api/sync/push with batch
   │   ├── Server processes each item idempotently
   │   └── Mark synced items in outbox
   │
   ├── PULL: Get remote changes
   │   ├── GET /api/sync/pull?since=lastSync
   │   ├── Server returns changed entities
   │   └── Upsert into local SQLite
   │
   └── MEDIA: Upload pending files
       ├── Get signed URLs from /api/uploads/sign
       ├── Upload each file with retry
       └── Update media_asset.remote_url
```

## Conflict Resolution

### Single-Writer Model

Inspections use a **single-writer** model to minimize conflicts:

1. When an inspection starts, it's "owned" by that inspector
2. Other users see it as read-only
3. Status changes are forward-only (can't go backward)

### Merge Strategy

For the rare case of conflicts:

| Entity | Strategy |
|--------|----------|
| Inspection metadata | Last-write-wins |
| Answers | Last-write-wins per item |
| Findings | Additive (merge all) |
| Photos | Additive (keep all) |
| Signatures | Additive (keep all) |

### Idempotency

All sync operations are idempotent:

- Each outbox item has a unique `id`
- Server uses `ON CONFLICT ... DO UPDATE`
- Safe to retry on network failures

## Media Upload Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   pending   │───▶│  uploading  │───▶│  uploaded   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │
       │                  ▼ (on failure)
       │           ┌─────────────┐
       │           │   failed    │
       │           └─────────────┘
       │                  │
       └──────────────────┘ (retry with backoff)
```

**Upload process:**
1. Get signed upload URL from API
2. Read local file
3. PUT to signed URL
4. On success: update `remote_url`, state = 'uploaded'
5. On failure: increment attempts, retry later

**Retry policy:**
- Max 5 attempts
- Exponential backoff
- Manual retry available in UI

## Usage Examples

### Initialize Database

```typescript
import { database } from './db';

// App startup
await database.initialize();
```

### Initialize Sync

```typescript
import { syncService } from './sync';

// After user login
await syncService.initialize(accessToken, tenantSlug);
await syncService.bootstrap();
syncService.startAutoSync(30000); // Every 30 seconds
```

### Use Sync Status in UI

```typescript
import { useSyncStatus } from './sync';

function MyComponent() {
  const { status, pendingChanges, isOnline } = useSyncStatus();

  return (
    <div>
      {isOnline ? 'Online' : 'Offline'}
      {pendingChanges > 0 && ` (${pendingChanges} pending)`}
    </div>
  );
}
```

### Create an Inspection

```typescript
import { inspectionsRepository } from './db';

const inspectionId = await inspectionsRepository.create(
  jobId,
  tenantId,
  templateId,
  templateVersion,
  inspectorId
);

// Automatically queued for sync
```

## Testing Offline Mode

Quick smoke test:
1. Enable Airplane Mode on device
2. Start an inspection
3. Complete checklist items
4. Take photos
5. Complete inspection
6. Disable Airplane Mode
7. Watch sync indicator

All data should sync automatically when connectivity returns.

### End-to-End Checklist (Auth + Sync + UI)

1. Sign in via magic link and confirm redirect to tenant selection.
2. Select a tenant; verify bootstrap completes (SyncStatusBar shows "Synced").
3. Open a job, start an inspection, answer at least one required item.
4. Toggle airplane mode; confirm SyncStatusBar shows "Offline".
5. While offline: answer more items, add a finding, and add notes.
6. Leave and re-open the inspection to ensure local data is persisted.
7. Disable airplane mode; confirm SyncStatusBar shows "Syncing..." then "Synced".
8. Verify pending counts go to zero and job status remains updated.

Expected:
- Outbox count increments while offline and clears after reconnect.
- Inspection answers and findings remain present after app restart.

## Troubleshooting

### Sync stuck on "pending"

Check the outbox for failed items:
```typescript
const failed = await outboxRepository.getFailedCount();
console.log(`${failed} items failed to sync`);

// Retry failed items
await outboxRepository.retryFailed();
```

### Media not uploading

Check upload stats:
```typescript
const stats = await mediaRepository.getUploadStats();
console.log(stats);
// { pending: 5, uploading: 0, uploaded: 10, failed: 2 }
```

### Database reset (for development)

```typescript
// Clear all data
await database.execute('DELETE FROM inspections');
await database.execute('DELETE FROM outbox');
// etc.
```
