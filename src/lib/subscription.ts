import { SubscriptionTier, SubscriptionStatus } from "@prisma/client";
import { prisma } from "./db";

// =============================================================================
// FEATURE DEFINITIONS
// =============================================================================

/**
 * All features that can be gated by tier.
 * Use these keys for type-safe feature checks.
 */
export const FEATURES = {
  // Reports & Inspections (all tiers)
  UNLIMITED_REPORTS: "unlimited-reports",
  OFFLINE_MODE: "offline-mode",
  PHOTO_CAPTURE: "photo-capture",
  PHOTO_ANNOTATION: "photo-annotation",
  PDF_REPORTS: "pdf-reports",

  // Client Experience (all tiers)
  CLIENT_BOOKING_PORTAL: "client-booking-portal",
  PAYMENT_COLLECTION: "payment-collection",
  CLIENT_REPORT_VIEWER: "client-report-viewer",

  // Customization
  CUSTOM_BRANDING: "custom-branding",
  CUSTOM_CHECKLIST_ITEMS: "custom-checklist-items",
  UNLIMITED_TEMPLATES: "unlimited-templates", // Team+ only

  // Productivity (all tiers)
  VOICE_NOTES: "voice-notes",
  COMMENT_LIBRARY: "comment-library",
  KEYBOARD_SHORTCUTS: "keyboard-shortcuts",

  // Team Features (Team+ only)
  TEAM_MANAGEMENT: "team-management",
  INSPECTOR_SCHEDULING: "inspector-scheduling",
  TEAM_CALENDAR: "team-calendar",
  INSPECTOR_PERFORMANCE: "inspector-performance",

  // Analytics
  BASIC_ANALYTICS: "basic-analytics",
  REVENUE_TRACKING: "revenue-tracking",
  ADVANCED_ANALYTICS: "advanced-analytics", // Business only
  CUSTOM_REPORTS: "custom-reports", // Business only

  // Integrations
  GOOGLE_CALENDAR_SYNC: "google-calendar-sync",
  API_ACCESS: "api-access", // Business only
  WEBHOOKS: "webhooks", // Business only

  // Support
  HELP_CENTER: "help-center",
  EMAIL_SUPPORT: "email-support",
  PRIORITY_SUPPORT: "priority-support", // Team+ only
  PHONE_SUPPORT: "phone-support", // Business only
  DEDICATED_CSM: "dedicated-csm", // Business only
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];

/**
 * Feature access matrix - which tiers can access which features.
 * Features not listed are available to all active tiers.
 */
const FEATURE_ACCESS: Record<Feature, SubscriptionTier[]> = {
  // All tiers (PRO, TEAM, BUSINESS)
  [FEATURES.UNLIMITED_REPORTS]: ["PRO", "TEAM", "BUSINESS"],
  [FEATURES.OFFLINE_MODE]: ["PRO", "TEAM", "BUSINESS"],
  [FEATURES.PHOTO_CAPTURE]: ["PRO", "TEAM", "BUSINESS"],
  [FEATURES.PHOTO_ANNOTATION]: ["PRO", "TEAM", "BUSINESS"],
  [FEATURES.PDF_REPORTS]: ["PRO", "TEAM", "BUSINESS"],
  [FEATURES.CLIENT_BOOKING_PORTAL]: ["PRO", "TEAM", "BUSINESS"],
  [FEATURES.PAYMENT_COLLECTION]: ["PRO", "TEAM", "BUSINESS"],
  [FEATURES.CLIENT_REPORT_VIEWER]: ["PRO", "TEAM", "BUSINESS"],
  [FEATURES.CUSTOM_BRANDING]: ["PRO", "TEAM", "BUSINESS"],
  [FEATURES.CUSTOM_CHECKLIST_ITEMS]: ["PRO", "TEAM", "BUSINESS"],
  [FEATURES.VOICE_NOTES]: ["PRO", "TEAM", "BUSINESS"],
  [FEATURES.COMMENT_LIBRARY]: ["PRO", "TEAM", "BUSINESS"],
  [FEATURES.KEYBOARD_SHORTCUTS]: ["PRO", "TEAM", "BUSINESS"],
  [FEATURES.BASIC_ANALYTICS]: ["PRO", "TEAM", "BUSINESS"],
  [FEATURES.REVENUE_TRACKING]: ["PRO", "TEAM", "BUSINESS"],
  [FEATURES.GOOGLE_CALENDAR_SYNC]: ["PRO", "TEAM", "BUSINESS"],
  [FEATURES.HELP_CENTER]: ["PRO", "TEAM", "BUSINESS"],
  [FEATURES.EMAIL_SUPPORT]: ["PRO", "TEAM", "BUSINESS"],

  // Team and Business only
  [FEATURES.UNLIMITED_TEMPLATES]: ["TEAM", "BUSINESS"],
  [FEATURES.TEAM_MANAGEMENT]: ["TEAM", "BUSINESS"],
  [FEATURES.INSPECTOR_SCHEDULING]: ["TEAM", "BUSINESS"],
  [FEATURES.TEAM_CALENDAR]: ["TEAM", "BUSINESS"],
  [FEATURES.INSPECTOR_PERFORMANCE]: ["TEAM", "BUSINESS"],
  [FEATURES.PRIORITY_SUPPORT]: ["TEAM", "BUSINESS"],

  // Business only
  [FEATURES.ADVANCED_ANALYTICS]: ["BUSINESS"],
  [FEATURES.CUSTOM_REPORTS]: ["BUSINESS"],
  [FEATURES.API_ACCESS]: ["BUSINESS"],
  [FEATURES.WEBHOOKS]: ["BUSINESS"],
  [FEATURES.PHONE_SUPPORT]: ["BUSINESS"],
  [FEATURES.DEDICATED_CSM]: ["BUSINESS"],
};

/**
 * Upgrade messages for features
 */
const FEATURE_UPGRADE_MESSAGES: Record<Feature, string> = {
  [FEATURES.UNLIMITED_REPORTS]: "Unlimited reports are available on all paid plans.",
  [FEATURES.OFFLINE_MODE]: "Offline mode is available on all paid plans.",
  [FEATURES.PHOTO_CAPTURE]: "Photo capture is available on all paid plans.",
  [FEATURES.PHOTO_ANNOTATION]: "Photo annotation is available on all paid plans.",
  [FEATURES.PDF_REPORTS]: "PDF reports are available on all paid plans.",
  [FEATURES.CLIENT_BOOKING_PORTAL]: "Client booking portal is available on all paid plans.",
  [FEATURES.PAYMENT_COLLECTION]: "Payment collection is available on all paid plans.",
  [FEATURES.CLIENT_REPORT_VIEWER]: "Client report viewer is available on all paid plans.",
  [FEATURES.CUSTOM_BRANDING]: "Custom branding is available on all paid plans.",
  [FEATURES.CUSTOM_CHECKLIST_ITEMS]: "Custom checklist items are available on all paid plans.",
  [FEATURES.VOICE_NOTES]: "Voice notes are available on all paid plans.",
  [FEATURES.COMMENT_LIBRARY]: "Comment library is available on all paid plans.",
  [FEATURES.KEYBOARD_SHORTCUTS]: "Keyboard shortcuts are available on all paid plans.",
  [FEATURES.BASIC_ANALYTICS]: "Basic analytics are available on all paid plans.",
  [FEATURES.REVENUE_TRACKING]: "Revenue tracking is available on all paid plans.",
  [FEATURES.GOOGLE_CALENDAR_SYNC]: "Google Calendar sync is available on all paid plans.",
  [FEATURES.HELP_CENTER]: "Help center access is available on all paid plans.",
  [FEATURES.EMAIL_SUPPORT]: "Email support is available on all paid plans.",
  [FEATURES.UNLIMITED_TEMPLATES]: "Upgrade to Team for unlimited report templates.",
  [FEATURES.TEAM_MANAGEMENT]: "Upgrade to Team to manage your inspection team.",
  [FEATURES.INSPECTOR_SCHEDULING]: "Upgrade to Team for inspector scheduling.",
  [FEATURES.TEAM_CALENDAR]: "Upgrade to Team for the team calendar.",
  [FEATURES.INSPECTOR_PERFORMANCE]: "Upgrade to Team to track inspector performance.",
  [FEATURES.PRIORITY_SUPPORT]: "Upgrade to Team for priority support.",
  [FEATURES.ADVANCED_ANALYTICS]: "Upgrade to Business for advanced analytics.",
  [FEATURES.CUSTOM_REPORTS]: "Upgrade to Business to create custom reports.",
  [FEATURES.API_ACCESS]: "Upgrade to Business for API access.",
  [FEATURES.WEBHOOKS]: "Upgrade to Business to use webhooks.",
  [FEATURES.PHONE_SUPPORT]: "Upgrade to Business for phone support.",
  [FEATURES.DEDICATED_CSM]: "Upgrade to Business for a dedicated success manager.",
};

// =============================================================================
// TIER LIMITS
// =============================================================================

export interface TierLimits {
  inspectors: number;
  templates: number;
  additionalSeatPrice: number | null;
}

const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  PRO: { inspectors: 1, templates: 3, additionalSeatPrice: null },
  TEAM: { inspectors: 5, templates: Infinity, additionalSeatPrice: 29 },
  BUSINESS: { inspectors: 15, templates: Infinity, additionalSeatPrice: 25 },
};

// =============================================================================
// PRICING
// =============================================================================

export const TIER_PRICING = {
  PRO: { monthly: 79, annual: 790 },
  TEAM: { monthly: 159, annual: 1590, additionalSeat: 29 },
  BUSINESS: { monthly: 279, annual: 2790, additionalSeat: 25 },
} as const;

export const TRIAL_DAYS = 30;

// =============================================================================
// TYPES
// =============================================================================

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  includedSeats: number;
  additionalSeats: number;
  isTrialing: boolean;
  isActive: boolean;
  isPastDue: boolean;
  maxInspectors: number;
  maxTemplates: number;
  daysUntilTrialEnd: number | null;
}

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxAllowed: number;
  canUpgrade: boolean;
  upgradeTier?: SubscriptionTier;
}

// =============================================================================
// SUBSCRIPTION QUERIES
// =============================================================================

/**
 * Get subscription info for a company
 */
export async function getSubscription(companyId: string): Promise<SubscriptionInfo | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      includedSeats: true,
      additionalSeats: true,
    },
  });

  if (!company) return null;

  const isTrialing = company.subscriptionStatus === "TRIALING";
  const isActive = company.subscriptionStatus === "ACTIVE" || isTrialing;
  const isPastDue = company.subscriptionStatus === "PAST_DUE";
  const limits = TIER_LIMITS[company.subscriptionTier];

  let daysUntilTrialEnd: number | null = null;
  if (isTrialing && company.trialEndsAt) {
    const now = new Date();
    const diff = company.trialEndsAt.getTime() - now.getTime();
    daysUntilTrialEnd = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return {
    tier: company.subscriptionTier,
    status: company.subscriptionStatus,
    trialEndsAt: company.trialEndsAt,
    includedSeats: company.includedSeats,
    additionalSeats: company.additionalSeats,
    isTrialing,
    isActive,
    isPastDue,
    maxInspectors: company.includedSeats + company.additionalSeats,
    maxTemplates: limits.templates,
    daysUntilTrialEnd,
  };
}

// =============================================================================
// FEATURE ACCESS CHECKS
// =============================================================================

/**
 * Check if a tier can access a specific feature
 */
export function canAccessFeature(tier: SubscriptionTier, feature: Feature): boolean {
  const allowedTiers = FEATURE_ACCESS[feature];
  if (!allowedTiers) return true;
  return allowedTiers.includes(tier);
}

/**
 * Get the minimum tier required for a feature
 */
export function getRequiredTier(feature: Feature): SubscriptionTier {
  const allowedTiers = FEATURE_ACCESS[feature];
  if (!allowedTiers || allowedTiers.length === 0) return "PRO";
  if (allowedTiers.includes("PRO")) return "PRO";
  if (allowedTiers.includes("TEAM")) return "TEAM";
  return "BUSINESS";
}

/**
 * Get all features available for a tier
 */
export function getTierFeatures(tier: SubscriptionTier): Feature[] {
  return Object.entries(FEATURE_ACCESS)
    .filter(([, tiers]) => tiers.includes(tier))
    .map(([feature]) => feature as Feature);
}

/**
 * Get features that require upgrade from current tier
 */
export function getLockedFeatures(tier: SubscriptionTier): Feature[] {
  return Object.entries(FEATURE_ACCESS)
    .filter(([, tiers]) => !tiers.includes(tier))
    .map(([feature]) => feature as Feature);
}

/**
 * Get the upgrade message for a feature
 */
export function getUpgradeMessage(feature: Feature): string {
  return FEATURE_UPGRADE_MESSAGES[feature] || "Upgrade your plan to access this feature.";
}

// =============================================================================
// LIMIT CHECKS
// =============================================================================

/**
 * Get the tier limit for a specific resource
 */
export function getTierLimit(tier: SubscriptionTier, resource: keyof TierLimits): number | null {
  return TIER_LIMITS[tier][resource];
}

/**
 * Get all limits for a tier
 */
export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_LIMITS[tier];
}

/**
 * Check if a company can add more inspectors
 */
export async function canAddInspector(companyId: string): Promise<LimitCheckResult> {
  const subscription = await getSubscription(companyId);

  if (!subscription) {
    return {
      allowed: false,
      reason: "No subscription found",
      currentCount: 0,
      maxAllowed: 0,
      canUpgrade: true,
    };
  }

  if (!subscription.isActive) {
    return {
      allowed: false,
      reason: "Subscription is not active",
      currentCount: 0,
      maxAllowed: subscription.maxInspectors,
      canUpgrade: true,
    };
  }

  const currentCount = await prisma.user.count({
    where: {
      companyId,
      role: { in: ["INSPECTOR", "OWNER", "ADMIN"] },
      isActive: true,
    },
  });

  const maxAllowed = subscription.maxInspectors;

  if (currentCount >= maxAllowed) {
    const upgradeTier = getUpgradeTier(subscription.tier);
    const canAddSeats = subscription.tier !== "PRO";

    return {
      allowed: false,
      reason: canAddSeats
        ? `Add additional seats ($${TIER_LIMITS[subscription.tier].additionalSeatPrice}/mo each) or upgrade to ${upgradeTier ? formatTierName(upgradeTier) : "a higher tier"}`
        : "Upgrade to Team to add more inspectors",
      currentCount,
      maxAllowed,
      canUpgrade: true,
      upgradeTier: upgradeTier || undefined,
    };
  }

  return {
    allowed: true,
    currentCount,
    maxAllowed,
    canUpgrade: false,
  };
}

/**
 * Check if a company can create more templates
 */
export async function canCreateTemplate(companyId: string): Promise<LimitCheckResult> {
  const subscription = await getSubscription(companyId);

  if (!subscription) {
    return {
      allowed: false,
      reason: "No subscription found",
      currentCount: 0,
      maxAllowed: 0,
      canUpgrade: true,
    };
  }

  const maxAllowed = subscription.maxTemplates;

  // Unlimited templates for Team and Business
  if (maxAllowed === Infinity) {
    return {
      allowed: true,
      currentCount: 0,
      maxAllowed,
      canUpgrade: false,
    };
  }

  const currentCount = await prisma.template.count({
    where: { companyId },
  });

  if (currentCount >= maxAllowed) {
    return {
      allowed: false,
      reason: "Upgrade to Team for unlimited templates",
      currentCount,
      maxAllowed,
      canUpgrade: true,
      upgradeTier: "TEAM",
    };
  }

  return {
    allowed: true,
    currentCount,
    maxAllowed,
    canUpgrade: false,
  };
}

// =============================================================================
// TIER UTILITIES
// =============================================================================

/**
 * Get the next tier for upgrade
 */
export function getUpgradeTier(currentTier: SubscriptionTier): SubscriptionTier | null {
  const upgrades: Record<SubscriptionTier, SubscriptionTier | null> = {
    PRO: "TEAM",
    TEAM: "BUSINESS",
    BUSINESS: null,
  };
  return upgrades[currentTier];
}

/**
 * Format tier name for display
 */
export function formatTierName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    PRO: "Pro",
    TEAM: "Team",
    BUSINESS: "Business",
  };
  return names[tier];
}

/**
 * Check if user is on highest tier
 */
export function isMaxTier(tier: SubscriptionTier): boolean {
  return tier === "BUSINESS";
}

/**
 * Get tier badge color
 */
export function getTierColor(tier: SubscriptionTier): string {
  const colors: Record<SubscriptionTier, string> = {
    PRO: "bg-slate-600",
    TEAM: "bg-blue-600",
    BUSINESS: "bg-primary",
  };
  return colors[tier];
}

// =============================================================================
// UPGRADE TRIGGERS (from pricing doc)
// =============================================================================

export interface UpgradeTrigger {
  trigger: string;
  message: string;
  targetTier: SubscriptionTier;
}

export function getUpgradeTriggers(tier: SubscriptionTier): UpgradeTrigger[] {
  const triggers: Record<SubscriptionTier, UpgradeTrigger[]> = {
    PRO: [
      {
        trigger: "add-inspector",
        message: "Add team members by upgrading to Team.",
        targetTier: "TEAM",
      },
      {
        trigger: "team-scheduling",
        message: "Team scheduling is available on Team and above.",
        targetTier: "TEAM",
      },
      {
        trigger: "unlimited-templates",
        message: "Get unlimited templates by upgrading to Team.",
        targetTier: "TEAM",
      },
    ],
    TEAM: [
      {
        trigger: "api-access",
        message: "API access is available on Business.",
        targetTier: "BUSINESS",
      },
      {
        trigger: "advanced-analytics",
        message: "Advanced analytics are available on Business.",
        targetTier: "BUSINESS",
      },
    ],
    BUSINESS: [],
  };

  return triggers[tier];
}
