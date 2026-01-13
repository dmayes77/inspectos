"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Save,
  Smartphone,
  Users,
  BarChart3,
  Zap,
  Headphones,
} from "lucide-react";

// Mock feature configuration
const initialFeatures = {
  core: [
    { id: "unlimited-inspections", name: "Unlimited Inspections", enabled: true, tiers: ["PRO", "TEAM", "BUSINESS"] },
    { id: "offline-mode", name: "Offline Mode", enabled: true, tiers: ["PRO", "TEAM", "BUSINESS"] },
    { id: "photo-annotation", name: "Photo Capture & Annotation", enabled: true, tiers: ["PRO", "TEAM", "BUSINESS"] },
    { id: "pdf-reports", name: "PDF Reports", enabled: true, tiers: ["PRO", "TEAM", "BUSINESS"] },
    { id: "booking-portal", name: "Client Booking Portal", enabled: true, tiers: ["PRO", "TEAM", "BUSINESS"] },
    { id: "payment-collection", name: "Payment Collection", enabled: true, tiers: ["PRO", "TEAM", "BUSINESS"] },
    { id: "custom-branding", name: "Custom Branding", enabled: true, tiers: ["PRO", "TEAM", "BUSINESS"] },
    { id: "voice-notes", name: "Voice Notes", enabled: true, tiers: ["PRO", "TEAM", "BUSINESS"] },
  ],
  team: [
    { id: "team-management", name: "Team Management", enabled: true, tiers: ["TEAM", "BUSINESS"] },
    { id: "team-scheduling", name: "Inspector Scheduling", enabled: true, tiers: ["TEAM", "BUSINESS"] },
    { id: "team-calendar", name: "Team Calendar", enabled: true, tiers: ["TEAM", "BUSINESS"] },
    { id: "inspector-performance", name: "Inspector Performance", enabled: true, tiers: ["TEAM", "BUSINESS"] },
    { id: "unlimited-templates", name: "Unlimited Templates", enabled: true, tiers: ["TEAM", "BUSINESS"] },
  ],
  business: [
    { id: "api-access", name: "API Access", enabled: true, tiers: ["BUSINESS"] },
    { id: "webhooks", name: "Webhooks", enabled: true, tiers: ["BUSINESS"] },
    { id: "advanced-analytics", name: "Advanced Analytics", enabled: true, tiers: ["BUSINESS"] },
    { id: "custom-reports", name: "Custom Reports", enabled: true, tiers: ["BUSINESS"] },
  ],
  support: [
    { id: "help-center", name: "Help Center", enabled: true, tiers: ["PRO", "TEAM", "BUSINESS"] },
    { id: "email-support", name: "Email Support", enabled: true, tiers: ["PRO", "TEAM", "BUSINESS"] },
    { id: "priority-support", name: "Priority Support", enabled: true, tiers: ["TEAM", "BUSINESS"] },
    { id: "phone-support", name: "Phone Support", enabled: true, tiers: ["BUSINESS"] },
    { id: "dedicated-csm", name: "Dedicated Success Manager", enabled: true, tiers: ["BUSINESS"] },
  ],
  beta: [
    { id: "ai-defect-detection", name: "AI Defect Detection", enabled: false, tiers: [] },
    { id: "ar-measurements", name: "AR Measurements", enabled: false, tiers: [] },
    { id: "client-portal-v2", name: "Client Portal v2", enabled: false, tiers: [] },
  ],
};

type FeatureCategory = keyof typeof initialFeatures;

export default function PlatformFeaturesPage() {
  const [features, setFeatures] = useState(initialFeatures);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleFeature = (category: FeatureCategory, featureId: string) => {
    setFeatures((prev) => ({
      ...prev,
      [category]: prev[category].map((f) =>
        f.id === featureId ? { ...f, enabled: !f.enabled } : f
      ),
    }));
    setHasChanges(true);
  };

  const toggleTier = (category: FeatureCategory, featureId: string, tier: string) => {
    setFeatures((prev) => ({
      ...prev,
      [category]: prev[category].map((f) => {
        if (f.id !== featureId) return f;
        const tiers = f.tiers.includes(tier)
          ? f.tiers.filter((t) => t !== tier)
          : [...f.tiers, tier];
        return { ...f, tiers };
      }),
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
  };

  const FeatureRow = ({
    feature,
    category,
  }: {
    feature: (typeof initialFeatures.core)[0];
    category: FeatureCategory;
  }) => (
    <div className="flex items-center justify-between rounded-lg bg-slate-800 p-4">
      <div className="flex items-center gap-4">
        <Switch
          checked={feature.enabled}
          onCheckedChange={() => toggleFeature(category, feature.id)}
        />
        <div>
          <p className="font-medium text-white">{feature.name}</p>
          <p className="text-xs text-slate-400">ID: {feature.id}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {["PRO", "TEAM", "BUSINESS"].map((tier) => (
          <button
            key={tier}
            onClick={() => toggleTier(category, feature.id, tier)}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              feature.tiers.includes(tier)
                ? tier === "BUSINESS"
                  ? "bg-primary text-primary-foreground"
                  : tier === "TEAM"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-600 text-white"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600"
            }`}
          >
            {tier}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Feature Management</h1>
          <p className="text-slate-400">Toggle features and manage tier access</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge className="bg-amber-500/20 text-amber-400">Unsaved changes</Badge>
          )}
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Core Features */}
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-slate-400" />
            <CardTitle className="text-white">Core Features</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Available to all tiers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {features.core.map((feature) => (
            <FeatureRow key={feature.id} feature={feature} category="core" />
          ))}
        </CardContent>
      </Card>

      {/* Team Features */}
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            <CardTitle className="text-white">Team Features</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Available to Team and Business tiers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {features.team.map((feature) => (
            <FeatureRow key={feature.id} feature={feature} category="team" />
          ))}
        </CardContent>
      </Card>

      {/* Business Features */}
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-white">Business Features</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Available to Business tier only
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {features.business.map((feature) => (
            <FeatureRow key={feature.id} feature={feature} category="business" />
          ))}
        </CardContent>
      </Card>

      {/* Support Features */}
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Headphones className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-white">Support Features</CardTitle>
          </div>
          <CardDescription className="text-slate-400">
            Support tier access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {features.support.map((feature) => (
            <FeatureRow key={feature.id} feature={feature} category="support" />
          ))}
        </CardContent>
      </Card>

      {/* Beta Features */}
      <Card className="border-amber-500/20 bg-slate-900">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-400" />
            <CardTitle className="text-white">Beta Features</CardTitle>
            <Badge className="bg-amber-500/20 text-amber-400">Experimental</Badge>
          </div>
          <CardDescription className="text-slate-400">
            Features in development - not yet available to customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {features.beta.map((feature) => (
            <FeatureRow key={feature.id} feature={feature} category="beta" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
