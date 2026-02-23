"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload, X } from "lucide-react";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { applyBrandColor } from "@/context/brand-color";
import { toast } from "sonner";

const PRESET_COLORS = [
  { color: "#f97316", label: "Orange" },
  { color: "#3b82f6", label: "Blue" },
  { color: "#10b981", label: "Green" },
  { color: "#8b5cf6", label: "Purple" },
  { color: "#ef4444", label: "Red" },
  { color: "#06b6d4", label: "Cyan" },
  { color: "#f59e0b", label: "Amber" },
  { color: "#64748b", label: "Slate" },
];

function isLightColor(hex: string): boolean {
  const color = hex.replace("#", "");
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5;
}

export default function BrandingSettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [branding, setBranding] = useState({ logoUrl: null as string | null, primaryColor: "#f97316" });
  const [logoUploading, setLogoUploading] = useState(false);

  const setColor = (color: string) => {
    setBranding((b) => ({ ...b, primaryColor: color }));
    applyBrandColor(color);
  };

  useEffect(() => {
    if (settings) setBranding(settings.branding);
  }, [settings]);

  const handleSave = () => {
    updateMutation.mutate(
      { branding },
      {
        onSuccess: () => toast.success("Branding saved"),
        onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to save"),
      }
    );
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"].includes(file.type)) {
      toast.error("Invalid file type. Allowed: PNG, JPEG, GIF, WebP, SVG");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large. Max 2MB");
      return;
    }
    setLogoUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/admin/settings/logo", { method: "POST", body: formData });
      if (!response.ok) { const d = await response.json(); throw new Error(d.error || "Upload failed"); }
      const data = await response.json();
      setBranding((b) => ({ ...b, logoUrl: data.logoUrl }));
      toast.success("Logo uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload logo");
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogoRemove = async () => {
    setLogoUploading(true);
    try {
      const response = await fetch("/api/admin/settings/logo", { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to remove logo");
      setBranding((b) => ({ ...b, logoUrl: null }));
      toast.success("Logo removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove logo");
    } finally {
      setLogoUploading(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Brand Color */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Color</CardTitle>
          <CardDescription>Choose the primary color used throughout your admin interface</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Color picker */}
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => setColor(preset.color)}
                    className={`group flex flex-col items-center gap-1.5 rounded-sm border-2 p-2 transition-all hover:scale-105 ${
                      branding.primaryColor === preset.color
                        ? "border-foreground bg-muted"
                        : "border-transparent hover:border-muted-foreground/20"
                    }`}
                  >
                    <div className="h-8 w-8 rounded-sm shadow-sm" style={{ backgroundColor: preset.color }} />
                    <span className="text-[10px] text-muted-foreground">{preset.label}</span>
                  </button>
                ))}
              </div>

              <div className="rounded-sm border p-3 space-y-2">
                <Label className="text-xs text-muted-foreground">Custom hex</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded-sm border-0 bg-transparent p-0"
                  />
                  <Input
                    value={branding.primaryColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                        setBranding((b) => ({ ...b, primaryColor: val }));
                        if (/^#[0-9A-Fa-f]{6}$/.test(val)) applyBrandColor(val);
                      }
                    }}
                    className="w-24 font-mono text-sm"
                    placeholder="#f97316"
                  />
                  <Button variant="ghost" className="text-xs" onClick={() => setColor("#f97316")}>
                    Reset
                  </Button>
                </div>
              </div>
            </div>

            {/* Live preview */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Live preview</Label>
              <div className="rounded-sm border bg-muted/30 p-4 space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Buttons</p>
                  <div className="flex flex-wrap gap-2">
                    <Button style={{ backgroundColor: branding.primaryColor, color: isLightColor(branding.primaryColor) ? "#1e293b" : "#fff" }}>
                      Primary
                    </Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Badge & link</p>
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: `${branding.primaryColor}20`, color: branding.primaryColor }}
                    >
                      Active
                    </span>
                    <a href="#" className="text-sm underline" style={{ color: branding.primaryColor }} onClick={(e) => e.preventDefault()}>
                      Sample link
                    </a>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Sidebar item</p>
                  <div className="rounded-sm border bg-background p-2 w-40">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-medium" style={{ backgroundColor: `${branding.primaryColor}15`, color: branding.primaryColor }}>
                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: branding.primaryColor }} />
                        Dashboard
                      </div>
                      <div className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />Orders
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Branding"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Company Logo</CardTitle>
          <CardDescription>Shown in the sidebar and on reports. PNG, JPG, SVG — max 2MB.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-sm border-2 border-dashed bg-muted overflow-hidden group">
              {branding.logoUrl ? (
                <>
                  <Image src={branding.logoUrl} alt="Logo" fill sizes="80px" className="object-contain p-1" />
                  <button
                    type="button"
                    onClick={handleLogoRemove}
                    disabled={logoUploading}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </>
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" onChange={handleLogoUpload} className="hidden" id="logo-upload" />
              <Button variant="outline" disabled={logoUploading} onClick={() => fileInputRef.current?.click()}>
                {logoUploading ? <><Loader2 className="mr-2 h-3 w-3 animate-spin" />Uploading...</> : branding.logoUrl ? "Change Logo" : "Upload Logo"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1.5">Recommended: 200×200px</p>
            </div>
          </div>

          <Separator className="my-5" />

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Logo"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
