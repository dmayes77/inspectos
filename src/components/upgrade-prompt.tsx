"use client";

import { useState, ReactNode } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Sparkles, Lock, ArrowRight, Zap } from "lucide-react";
import type { SubscriptionTier } from "@prisma/client";
import {
  useFeatureAccess,
  formatTierName,
  type Feature,
  FEATURES,
} from "@/hooks/use-subscription";
import { TIER_PRICING, getUpgradeMessage } from "@/lib/subscription";

// =============================================================================
// TIER FEATURE LISTS
// =============================================================================

const TIER_FEATURES: Record<SubscriptionTier, string[]> = {
  PRO: [
    "1 inspector",
    "Unlimited inspections & reports",
    "Offline mode",
    "Photo capture & annotation",
    "Custom branding",
    "Voice notes",
    "Comment library",
    "Basic analytics",
    "Client booking portal",
    "Payment collection",
  ],
  TEAM: [
    "5 inspectors included (+$29/mo each)",
    "Everything in Pro",
    "Unlimited templates",
    "Team management",
    "Inspector scheduling",
    "Team calendar",
    "Inspector performance tracking",
    "Priority support",
  ],
  BUSINESS: [
    "15 inspectors included (+$25/mo each)",
    "Everything in Team",
    "API access",
    "Webhooks",
    "Advanced analytics",
    "Custom reports",
    "Phone support",
    "Dedicated success manager",
  ],
};

// =============================================================================
// UPGRADE PROMPT DIALOG
// =============================================================================

interface UpgradePromptProps {
  feature: Feature;
  requiredTier: SubscriptionTier;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradePrompt({
  feature,
  requiredTier,
  open,
  onOpenChange,
}: UpgradePromptProps) {
  const tierName = formatTierName(requiredTier);
  const message = getUpgradeMessage(feature);
  const pricing = TIER_PRICING[requiredTier];
  const features = TIER_FEATURES[requiredTier];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">
            Upgrade to {tierName}
          </DialogTitle>
          <DialogDescription className="text-center">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-bold">${pricing.monthly}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            or ${pricing.annual}/year (save ~17%)
          </p>

          <div className="space-y-2 pt-2">
            {features.slice(0, 5).map((feat) => (
              <div key={feat} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 shrink-0 text-primary" />
                <span>{feat}</span>
              </div>
            ))}
            {features.length > 5 && (
              <p className="pl-6 text-sm text-muted-foreground">
                + {features.length - 5} more features
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full" size="lg" asChild>
            <Link href="/settings/billing">
              Upgrade to {tierName}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// UPGRADE BANNER (INLINE)
// =============================================================================

interface UpgradeBannerProps {
  feature: Feature;
  requiredTier: SubscriptionTier;
  className?: string;
  compact?: boolean;
}

export function UpgradeBanner({
  feature,
  requiredTier,
  className = "",
  compact = false,
}: UpgradeBannerProps) {
  const tierName = formatTierName(requiredTier);
  const message = getUpgradeMessage(feature);

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 ${className}`}
      >
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          <span className="text-sm">{message}</span>
        </div>
        <Button size="sm" asChild>
          <Link href="/settings/billing">Upgrade</Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{message}</p>
          <p className="text-sm text-muted-foreground">
            Unlock this feature with the {tierName} plan.
          </p>
        </div>
      </div>
      <Button asChild>
        <Link href="/settings/billing">Upgrade</Link>
      </Button>
    </div>
  );
}

// =============================================================================
// FEATURE GATE
// =============================================================================

interface FeatureGateProps {
  /** The feature to gate */
  feature: Feature;
  /** Content to show when user has access */
  children: ReactNode;
  /** Custom fallback when user doesn't have access (defaults to UpgradeBanner) */
  fallback?: ReactNode;
  /** If true, renders nothing when user doesn't have access */
  hideWhenLocked?: boolean;
  /** If true, uses compact banner style */
  compact?: boolean;
}

/**
 * Feature gate component - conditionally renders content based on subscription tier.
 *
 * Usage:
 * ```tsx
 * <FeatureGate feature={FEATURES.TEAM_MANAGEMENT}>
 *   <TeamManagementPanel />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  feature,
  children,
  fallback,
  hideWhenLocked = false,
  compact = false,
}: FeatureGateProps) {
  const { hasAccess, requiredTier } = useFeatureAccess(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (hideWhenLocked) {
    return null;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <UpgradeBanner feature={feature} requiredTier={requiredTier} compact={compact} />
  );
}

// =============================================================================
// LOCKED FEATURE CARD
// =============================================================================

interface LockedFeatureCardProps {
  feature: Feature;
  title: string;
  description: string;
  icon?: ReactNode;
  className?: string;
}

/**
 * A card that shows a locked feature with upgrade prompt
 */
export function LockedFeatureCard({
  feature,
  title,
  description,
  icon,
  className = "",
}: LockedFeatureCardProps) {
  const { requiredTier } = useFeatureAccess(feature);
  const tierName = formatTierName(requiredTier);
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <>
      <Card className={`relative overflow-hidden ${className}`}>
        <div className="absolute inset-0 bg-linear-to-br from-slate-900/50 to-slate-900/80 backdrop-blur-[1px]" />
        <CardContent className="relative flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800">
            {icon || <Lock className="h-6 w-6 text-slate-400" />}
          </div>
          <Badge className="mb-2 bg-primary/20 text-primary">{tierName}</Badge>
          <h3 className="mb-1 font-semibold text-white">{title}</h3>
          <p className="mb-4 text-sm text-slate-400">{description}</p>
          <Button size="sm" onClick={() => setShowPrompt(true)}>
            <Zap className="mr-2 h-4 w-4" />
            Unlock Feature
          </Button>
        </CardContent>
      </Card>

      <UpgradePrompt
        feature={feature}
        requiredTier={requiredTier}
        open={showPrompt}
        onOpenChange={setShowPrompt}
      />
    </>
  );
}

// =============================================================================
// TRIAL BANNER
// =============================================================================

interface TrialBannerProps {
  daysRemaining: number;
  className?: string;
}

export function TrialBanner({ daysRemaining, className = "" }: TrialBannerProps) {
  const isUrgent = daysRemaining <= 5;

  return (
    <div
      className={`flex items-center justify-between rounded-lg p-3 ${
        isUrgent
          ? "border border-amber-500/20 bg-amber-500/10"
          : "border border-blue-500/20 bg-blue-500/10"
      } ${className}`}
    >
      <div className="flex items-center gap-2">
        <Sparkles
          className={`h-4 w-4 ${isUrgent ? "text-amber-500" : "text-blue-500"}`}
        />
        <span className={`text-sm ${isUrgent ? "text-amber-200" : "text-blue-200"}`}>
          {daysRemaining === 0
            ? "Your trial ends today!"
            : daysRemaining === 1
              ? "Your trial ends tomorrow!"
              : `${daysRemaining} days left in your trial`}
        </span>
      </div>
      <Button size="sm" variant={isUrgent ? "default" : "outline"} asChild>
        <Link href="/settings/billing">Choose a Plan</Link>
      </Button>
    </div>
  );
}

// =============================================================================
// HOOK FOR UPGRADE PROMPT STATE
// =============================================================================

export function useUpgradePrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [promptFeature, setPromptFeature] = useState<Feature>(FEATURES.TEAM_MANAGEMENT);
  const [promptTier, setPromptTier] = useState<SubscriptionTier>("TEAM");

  const showUpgradePrompt = (feature: Feature, requiredTier: SubscriptionTier) => {
    setPromptFeature(feature);
    setPromptTier(requiredTier);
    setIsOpen(true);
  };

  return {
    isOpen,
    setIsOpen,
    promptFeature,
    promptTier,
    showUpgradePrompt,
    UpgradePromptComponent: () => (
      <UpgradePrompt
        feature={promptFeature}
        requiredTier={promptTier}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    ),
  };
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

export { FEATURES };
