"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getNetworkStatus,
  addNetworkListener,
  checkConnectivity,
  type NetworkState,
} from "@/services/network";

export interface NetworkInfo extends NetworkState {
  isOnline: boolean;
  isOffline: boolean;
  isWifi: boolean;
  isCellular: boolean;
}

export function useNetwork(): NetworkInfo {
  const [network, setNetwork] = useState<NetworkState>({
    connected: true,
    connectionType: "unknown",
  });

  useEffect(() => {
    // Get initial status
    getNetworkStatus().then(setNetwork);

    // Listen for changes
    const unsubscribe = addNetworkListener(setNetwork);

    return unsubscribe;
  }, []);

  return {
    ...network,
    isOnline: network.connected,
    isOffline: !network.connected,
    isWifi: network.connectionType === "wifi",
    isCellular: network.connectionType === "cellular",
  };
}

export function useIsOnline(): boolean {
  return useNetwork().isOnline;
}

export function useIsOffline(): boolean {
  return useNetwork().isOffline;
}

export function useConnectivityCheck() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const check = useCallback(async () => {
    setIsChecking(true);
    const connected = await checkConnectivity();
    setIsConnected(connected);
    setIsChecking(false);
    return connected;
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { isConnected, isChecking, check };
}
