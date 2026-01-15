"use client";

import { useEffect, useState } from "react";
import { getNetworkStatus, addNetworkListener, type NetworkState } from "@/services";
import { cn } from "@/lib/utils";

interface OfflineBannerProps {
  className?: string;
}

export function OfflineBanner({ className }: OfflineBannerProps) {
  const [network, setNetwork] = useState<NetworkState | null>(null);

  useEffect(() => {
    let remove: (() => void) | undefined;

    (async () => {
      const status = await getNetworkStatus();
      setNetwork(status);
      remove = await addNetworkListener(setNetwork);
    })();

    return () => {
      if (remove) remove();
    };
  }, []);

  if (!network || network.connected) return null;

  return (
    <div className={cn("w-full bg-amber-500 text-white px-3 py-2 text-sm font-medium", className)}>
      Offline mode: actions will be queued and synced when connection returns.
    </div>
  );
}
