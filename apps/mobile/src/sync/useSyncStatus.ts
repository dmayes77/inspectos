import { useState, useEffect } from 'react';
import { syncService, SyncStatus } from './syncService';

interface SyncState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  pendingChanges: number;
  pendingUploads: number;
  error: string | null;
  isOnline: boolean;
}

/**
 * React hook for sync status
 */
export function useSyncStatus(): SyncState {
  const [state, setState] = useState<SyncState>(() => ({
    ...syncService.getState(),
    isOnline: syncService.getIsOnline()
  }));

  useEffect(() => {
    const unsubscribe = syncService.subscribe((syncState) => {
      setState({
        ...syncState,
        isOnline: syncService.getIsOnline()
      });
    });

    return unsubscribe;
  }, []);

  return state;
}

/**
 * React hook for sync actions
 */
export function useSyncActions() {
  const sync = async () => {
    await syncService.sync();
  };

  const bootstrap = async () => {
    await syncService.bootstrap();
  };

  return { sync, bootstrap };
}
