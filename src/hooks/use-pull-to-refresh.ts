"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Options {
  threshold?: number; // pixels to trigger
  onRefresh: () => Promise<void> | void;
}

/**
 * Lightweight pull-to-refresh for mobile scroll containers.
 * Call usePullToRefresh on a scrollable element and attach the returned props.
 */
export function usePullToRefresh({ threshold = 60, onRefresh }: Options) {
  const startY = useRef<number | null>(null);
  const pulling = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (isRefreshing) return;
    if (e.touches.length !== 1) return;
    startY.current = e.touches[0].clientY;
  }, [isRefreshing]);

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isRefreshing) return;
      if (e.touches.length !== 1) return;
      if (startY.current === null) return;

      const currentY = e.touches[0].clientY;
      const delta = currentY - startY.current;

      // Only trigger if pulling down at top of scroll
      const target = e.currentTarget as HTMLElement;
      const atTop = target.scrollTop <= 0;
      if (delta > threshold && atTop) {
        pulling.current = true;
      }
    },
    [isRefreshing, threshold]
  );

  const onTouchEnd = useCallback(async () => {
    if (isRefreshing) return;
    if (pulling.current) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    pulling.current = false;
    startY.current = null;
  }, [isRefreshing, onRefresh]);

  useEffect(() => {
    return () => {
      startY.current = null;
      pulling.current = false;
    };
  }, []);

  return {
    isRefreshing,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
