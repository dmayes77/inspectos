/**
 * Network services stub for web app
 * This provides a simplified version of network status for web
 */

export interface NetworkState {
  connected: boolean;
  connectionType: string;
}

export async function getNetworkStatus(): Promise<NetworkState> {
  return {
    connected: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connectionType: 'unknown',
  };
}

export async function addNetworkListener(
  callback: (state: NetworkState) => void
): Promise<() => void> {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => callback({ connected: true, connectionType: 'unknown' });
  const handleOffline = () => callback({ connected: false, connectionType: 'unknown' });

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
