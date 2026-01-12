"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";

interface NativeRedirectProps {
  children?: ReactNode;
  fallback?: ReactNode;
}

export function NativeRedirect({ children, fallback = null }: NativeRedirectProps) {
  const router = useRouter();
  const [isNative, setIsNative] = useState<boolean | null>(null);

  useEffect(() => {
    const native = Capacitor.isNativePlatform();
    setIsNative(native);

    if (native) {
      router.replace("/inspector/schedule");
    }
  }, [router]);

  // Still determining platform - show nothing to prevent flash
  if (isNative === null) {
    return <>{fallback}</>;
  }

  // Native platform - show nothing while redirecting
  if (isNative) {
    return <>{fallback}</>;
  }

  // Web platform - render children (marketing page)
  return <>{children}</>;
}
