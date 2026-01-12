"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw, AlertCircle } from "lucide-react";

// Mock current pricing configuration
const initialPricing = {
  trial: {
    enabled: true,
    durationDays: 30,
    requireCreditCard: true,
  },
  tiers: {
    pro: {
      name: "Pro",
      monthlyPrice: 79,
      annualPrice: 790,
      includedInspectors: 1,
      maxTemplates: 3,
      features: ["unlimited-inspections", "offline-mode", "custom-branding", "voice-notes", "basic-analytics"],
    },
    team: {
      name: "Team",
      monthlyPrice: 159,
      annualPrice: 1590,
      includedInspectors: 5,
      additionalSeatPrice: 29,
      maxTemplates: -1, // unlimited
      features: ["team-management", "team-scheduling", "team-calendar", "inspector-performance", "priority-support"],
    },
    business: {
      name: "Business",
      monthlyPrice: 279,
      annualPrice: 2790,
      includedInspectors: 15,
      additionalSeatPrice: 25,
      maxTemplates: -1, // unlimited
      features: ["api-access", "webhooks", "advanced-analytics", "custom-reports", "phone-support", "dedicated-csm"],
    },
  },
  annualDiscount: 17, // percentage
};

export default function PlatformPricingPage() {
  const [pricing, setPricing] = useState(initialPricing);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateTrial = (field: string, value: number | boolean) => {
    setPricing((prev) => ({
      ...prev,
      trial: { ...prev.trial, [field]: value },
    }));
    setHasChanges(true);
  };

  const updateTier = (tier: string, field: string, value: number | string) => {
    setPricing((prev) => ({
      ...prev,
      tiers: {
        ...prev.tiers,
        [tier]: { ...prev.tiers[tier as keyof typeof prev.tiers], [field]: value },
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
  };

  const handleReset = () => {
    setPricing(initialPricing);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Pricing Configuration</h1>
          <p className="text-slate-400">Manage pricing tiers and trial settings</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge className="bg-amber-500/20 text-amber-400">Unsaved changes</Badge>
          )}
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300"
            onClick={handleReset}
            disabled={!hasChanges}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Warning */}
      <Card className="border-amber-500/20 bg-amber-500/10">
        <CardContent className="flex items-center gap-3 p-4">
          <AlertCircle className="h-5 w-5 text-amber-400" />
          <p className="text-sm text-amber-200">
            Changes to pricing will only affect new subscriptions. Existing customers will keep their current rates until they change their plan.
          </p>
        </CardContent>
      </Card>

      {/* Trial Settings */}
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle className="text-white">Trial Settings</CardTitle>
          <CardDescription className="text-slate-400">
            Configure free trial options for new signups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-white">Enable Free Trial</Label>
              <p className="text-sm text-slate-400">
                Allow new users to try before they buy
              </p>
            </div>
            <Switch
              checked={pricing.trial.enabled}
              onCheckedChange={(checked) => updateTrial("enabled", checked)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="trialDays" className="text-white">
                Trial Duration (days)
              </Label>
              <Input
                id="trialDays"
                type="number"
                value={pricing.trial.durationDays}
                onChange={(e) =>
                  updateTrial("durationDays", parseInt(e.target.value) || 0)
                }
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-700 p-4">
              <div>
                <Label className="text-white">Require Credit Card</Label>
                <p className="text-sm text-slate-400">
                  Filter out low-intent signups
                </p>
              </div>
              <Switch
                checked={pricing.trial.requireCreditCard}
                onCheckedChange={(checked) =>
                  updateTrial("requireCreditCard", checked)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Tiers */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pro Tier */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-white">Pro Tier</CardTitle>
            <CardDescription className="text-slate-400">
              For solo inspectors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proMonthly" className="text-white">
                Monthly Price ($)
              </Label>
              <Input
                id="proMonthly"
                type="number"
                value={pricing.tiers.pro.monthlyPrice}
                onChange={(e) =>
                  updateTier("pro", "monthlyPrice", parseInt(e.target.value) || 0)
                }
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proAnnual" className="text-white">
                Annual Price ($)
              </Label>
              <Input
                id="proAnnual"
                type="number"
                value={pricing.tiers.pro.annualPrice}
                onChange={(e) =>
                  updateTier("pro", "annualPrice", parseInt(e.target.value) || 0)
                }
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proInspectors" className="text-white">
                Included Inspectors
              </Label>
              <Input
                id="proInspectors"
                type="number"
                value={pricing.tiers.pro.includedInspectors}
                onChange={(e) =>
                  updateTier("pro", "includedInspectors", parseInt(e.target.value) || 0)
                }
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proTemplates" className="text-white">
                Max Templates (-1 for unlimited)
              </Label>
              <Input
                id="proTemplates"
                type="number"
                value={pricing.tiers.pro.maxTemplates}
                onChange={(e) =>
                  updateTier("pro", "maxTemplates", parseInt(e.target.value))
                }
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Team Tier */}
        <Card className="border-primary/50 bg-slate-900">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Team Tier</CardTitle>
              <Badge className="bg-primary">Popular</Badge>
            </div>
            <CardDescription className="text-slate-400">
              For growing teams
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamMonthly" className="text-white">
                Monthly Price ($)
              </Label>
              <Input
                id="teamMonthly"
                type="number"
                value={pricing.tiers.team.monthlyPrice}
                onChange={(e) =>
                  updateTier("team", "monthlyPrice", parseInt(e.target.value) || 0)
                }
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamAnnual" className="text-white">
                Annual Price ($)
              </Label>
              <Input
                id="teamAnnual"
                type="number"
                value={pricing.tiers.team.annualPrice}
                onChange={(e) =>
                  updateTier("team", "annualPrice", parseInt(e.target.value) || 0)
                }
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamInspectors" className="text-white">
                Included Inspectors
              </Label>
              <Input
                id="teamInspectors"
                type="number"
                value={pricing.tiers.team.includedInspectors}
                onChange={(e) =>
                  updateTier("team", "includedInspectors", parseInt(e.target.value) || 0)
                }
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamAdditional" className="text-white">
                Additional Seat Price ($)
              </Label>
              <Input
                id="teamAdditional"
                type="number"
                value={pricing.tiers.team.additionalSeatPrice}
                onChange={(e) =>
                  updateTier("team", "additionalSeatPrice", parseInt(e.target.value) || 0)
                }
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Tier */}
        <Card className="border-slate-800 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-white">Business Tier</CardTitle>
            <CardDescription className="text-slate-400">
              For inspection firms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessMonthly" className="text-white">
                Monthly Price ($)
              </Label>
              <Input
                id="businessMonthly"
                type="number"
                value={pricing.tiers.business.monthlyPrice}
                onChange={(e) =>
                  updateTier("business", "monthlyPrice", parseInt(e.target.value) || 0)
                }
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessAnnual" className="text-white">
                Annual Price ($)
              </Label>
              <Input
                id="businessAnnual"
                type="number"
                value={pricing.tiers.business.annualPrice}
                onChange={(e) =>
                  updateTier("business", "annualPrice", parseInt(e.target.value) || 0)
                }
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessInspectors" className="text-white">
                Included Inspectors
              </Label>
              <Input
                id="businessInspectors"
                type="number"
                value={pricing.tiers.business.includedInspectors}
                onChange={(e) =>
                  updateTier("business", "includedInspectors", parseInt(e.target.value) || 0)
                }
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessAdditional" className="text-white">
                Additional Seat Price ($)
              </Label>
              <Input
                id="businessAdditional"
                type="number"
                value={pricing.tiers.business.additionalSeatPrice}
                onChange={(e) =>
                  updateTier("business", "additionalSeatPrice", parseInt(e.target.value) || 0)
                }
                className="border-slate-700 bg-slate-800 text-white"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Annual Discount */}
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <CardTitle className="text-white">Annual Discount</CardTitle>
          <CardDescription className="text-slate-400">
            Percentage discount for annual billing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="annualDiscount" className="text-white">
                Discount Percentage (%)
              </Label>
              <Input
                id="annualDiscount"
                type="number"
                value={pricing.annualDiscount}
                onChange={(e) => {
                  setPricing((prev) => ({
                    ...prev,
                    annualDiscount: parseInt(e.target.value) || 0,
                  }));
                  setHasChanges(true);
                }}
                className="w-32 border-slate-700 bg-slate-800 text-white"
              />
            </div>
            <p className="text-sm text-slate-400">
              Current: ~{pricing.annualDiscount}% off (~2 months free)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
