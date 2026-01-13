"use client";

import { createContext, useContext, useMemo, ReactNode } from "react";
import type { SubscriptionTier, SubscriptionStatus } from "@prisma/client";
import {
  FEATURES,
  type Feature,
  canAccessFeature as checkFeatureAccess,
  getRequiredTier,
  getUpgradeMessage,
  getTierLimits as getLimits,
  formatTierName,
  getUpgradeTier,
  getTierColor,
  isMaxTier,
  type TierLimits,
} from "@/lib/subscription";

// =============================================================================
// CONTEXT
// =============================================================================

export interface SubscriptionContextValue {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  isTrialing: boolean;
  isActive: boolean;
  isPastDue: boolean;
  maxInspectors: number;
  maxTemplates: number;
  trialEndsAt: Date | null;
  daysUntilTrialEnd: number | null;
  includedSeats: number;
  additionalSeats: number;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({
  children,
  subscription,
}: {
  children: ReactNode;
  subscription: SubscriptionContextValue;
}) {
  return (
    <SubscriptionContext.Provider value={subscription}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Get the current subscription context
 */
export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);

  if (!context) {
    // Return default Pro tier for development/when no provider
    return {
      tier: "PRO",
      status: "TRIALING",
      isTrialing: true,
      isActive: true,
      isPastDue: false,
      maxInspectors: 1,
      maxTemplates: 3,
      trialEndsAt: null,
      daysUntilTrialEnd: null,
      includedSeats: 1,
      additionalSeats: 0,
    };
  }

  return context;
}

/**
 * Check if the current subscription can access a feature
 */
export function useCanAccessFeature(feature: Feature): boolean {
  const { tier, isActive } = useSubscription();

  return useMemo(() => {
    if (!isActive) return false;
    return checkFeatureAccess(tier, feature);
  }, [tier, isActive, feature]);
}

/**
 * Get feature access info with upgrade details
 */
export function useFeatureAccess(feature: Feature): {
  hasAccess: boolean;
  requiredTier: SubscriptionTier;
  upgradeMessage: string;
  canUpgrade: boolean;
} {
  const { tier, isActive } = useSubscription();

  return useMemo(() => {
    const hasAccess = isActive && checkFeatureAccess(tier, feature);
    const requiredTier = getRequiredTier(feature);
    const upgradeMessage = getUpgradeMessage(feature);
    const canUpgrade = !isMaxTier(tier);

    return { hasAccess, requiredTier, upgradeMessage, canUpgrade };
  }, [tier, isActive, feature]);
}

/**
 * Get tier limits for the current subscription
 */
export function useTierLimits(): TierLimits & {
  currentInspectors: number;
  currentTemplates: number;
  canAddInspector: boolean;
  canCreateTemplate: boolean;
} {
  const { tier, maxTemplates } = useSubscription();

  return useMemo(() => {
    const limits = getLimits(tier);
    return {
      ...limits,
      currentInspectors: 0, // Will be populated by server
      currentTemplates: 0, // Will be populated by server
      canAddInspector: true, // Will be updated by server check
      canCreateTemplate: maxTemplates === Infinity || true,
    };
  }, [tier, maxTemplates]);
}

/**
 * Get upgrade info for the current tier
 */
export function useUpgradeInfo(): {
  currentTier: SubscriptionTier;
  nextTier: SubscriptionTier | null;
  currentTierName: string;
  nextTierName: string | null;
  isMaxTier: boolean;
  tierColor: string;
} {
  const { tier } = useSubscription();

  return useMemo(() => {
    const nextTier = getUpgradeTier(tier);
    return {
      currentTier: tier,
      nextTier,
      currentTierName: formatTierName(tier),
      nextTierName: nextTier ? formatTierName(nextTier) : null,
      isMaxTier: isMaxTier(tier),
      tierColor: getTierColor(tier),
    };
  }, [tier]);
}

/**
 * Check if subscription is in trial and get trial info
 */
export function useTrialInfo(): {
  isTrialing: boolean;
  daysRemaining: number | null;
  trialEndsAt: Date | null;
  isTrialExpiringSoon: boolean;
} {
  const { isTrialing, daysUntilTrialEnd, trialEndsAt } = useSubscription();

  return useMemo(() => {
    return {
      isTrialing,
      daysRemaining: daysUntilTrialEnd,
      trialEndsAt,
      isTrialExpiringSoon: isTrialing && daysUntilTrialEnd !== null && daysUntilTrialEnd <= 5,
    };
  }, [isTrialing, daysUntilTrialEnd, trialEndsAt]);
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

export { FEATURES, formatTierName, getTierColor, isMaxTier };
export type { Feature, TierLimits };
