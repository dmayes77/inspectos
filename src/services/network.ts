import { Network, ConnectionStatus } from "@capacitor/network";

export interface NetworkState {
  connected: boolean;
  connectionType: ConnectionType;
}

export type ConnectionType = "wifi" | "cellular" | "none" | "unknown";

// =============================================================================
// NETWORK STATUS
// =============================================================================

export async function getNetworkStatus(): Promise<NetworkState> {
  try {
    const status: ConnectionStatus = await Network.getStatus();
    return {
      connected: status.connected,
      connectionType: mapConnectionType(status.connectionType),
    };
  } catch {
    // Fallback for web
    return {
      connected: navigator.onLine,
      connectionType: navigator.onLine ? "unknown" : "none",
    };
  }
}

function mapConnectionType(type: string): ConnectionType {
  switch (type) {
    case "wifi":
      return "wifi";
    case "cellular":
      return "cellular";
    case "none":
      return "none";
    default:
      return "unknown";
  }
}

// =============================================================================
// NETWORK LISTENERS
// =============================================================================

type NetworkCallback = (status: NetworkState) => void;

const listeners: Set<NetworkCallback> = new Set();
let listenerHandle: (() => void) | null = null;

export function addNetworkListener(callback: NetworkCallback): () => void {
  listeners.add(callback);

  // Set up the native listener if this is the first listener
  if (listeners.size === 1) {
    setupNativeListener();
  }

  // Return unsubscribe function
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && listenerHandle) {
      listenerHandle();
      listenerHandle = null;
    }
  };
}

async function setupNativeListener(): Promise<void> {
  try {
    const handle = await Network.addListener("networkStatusChange", (status) => {
      const networkState: NetworkState = {
        connected: status.connected,
        connectionType: mapConnectionType(status.connectionType),
      };
      listeners.forEach((cb) => cb(networkState));
    });
    listenerHandle = () => handle.remove();
  } catch {
    // Fallback for web
    const onlineHandler = () => {
      listeners.forEach((cb) => cb({ connected: true, connectionType: "unknown" }));
    };
    const offlineHandler = () => {
      listeners.forEach((cb) => cb({ connected: false, connectionType: "none" }));
    };

    window.addEventListener("online", onlineHandler);
    window.addEventListener("offline", offlineHandler);

    listenerHandle = () => {
      window.removeEventListener("online", onlineHandler);
      window.removeEventListener("offline", offlineHandler);
    };
  }
}

// =============================================================================
// CONNECTIVITY CHECK
// =============================================================================

export async function checkConnectivity(
  testUrl = "https://www.google.com/generate_204"
): Promise<boolean> {
  try {
    const status = await getNetworkStatus();
    if (!status.connected) return false;

    // Actually test connectivity with a request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(testUrl, {
      method: "HEAD",
      mode: "no-cors",
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// SYNC HELPER
// =============================================================================

export async function waitForConnection(
  timeoutMs = 30000
): Promise<boolean> {
  const status = await getNetworkStatus();
  if (status.connected) return true;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(false);
    }, timeoutMs);

    const unsubscribe = addNetworkListener((newStatus) => {
      if (newStatus.connected) {
        clearTimeout(timeout);
        unsubscribe();
        resolve(true);
      }
    });
  });
}
