"use client";

import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <WifiOff className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="mb-2 text-2xl font-bold">You&apos;re Offline</h1>
        <p className="mb-6 text-muted-foreground">
          It looks like you&apos;ve lost your internet connection. Some features
          may be unavailable until you&apos;re back online.
        </p>
        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
          <p className="text-sm text-muted-foreground">
            Don&apos;t worry - any inspections you&apos;ve started will be saved
            locally and synced when you&apos;re back online.
          </p>
        </div>
      </div>
    </div>
  );
}
