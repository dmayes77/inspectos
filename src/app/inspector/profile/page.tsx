"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { InspectorShell } from "@/components/layout/inspector-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Mail,
  Phone,
  MapPin,
  Shield,
  Bell,
  Moon,
  Wifi,
  HardDrive,
  ChevronRight,
  Camera,
  LogOut,
  Star,
  Calendar,
  FileText,
} from "lucide-react";
import { mockInspector } from "@/lib/mock-data";
import { impactLight, impactMedium } from "@/services/haptics";

const inspectorProfile = {
  ...mockInspector,
  company: "Acme Home Inspections",
  location: "Austin, TX",
  certifications: ["ASHI Certified", "InterNACHI", "Texas Licensed"],
  stats: {
    totalInspections: 1247,
    thisMonth: 28,
    avgRating: 4.9,
  },
};

export default function ProfilePage() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  const handleToggle = (setter: (val: boolean) => void, currentValue: boolean) => {
    impactLight();
    setter(!currentValue);
  };

  const handleDarkModeToggle = () => {
    impactLight();
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSignOut = () => {
    impactMedium();
    // TODO: Implement sign out
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <InspectorShell title="Profile" user={mockInspector}>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {getInitials(inspectorProfile.name)}
                  </AvatarFallback>
                </Avatar>
                <button
                  className="absolute bottom-3 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                  onClick={() => impactLight()}
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <h2 className="text-xl font-semibold">{inspectorProfile.name}</h2>
              <p className="text-muted-foreground capitalize">{inspectorProfile.role}</p>
              <p className="text-sm text-muted-foreground">{inspectorProfile.company}</p>

              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {inspectorProfile.certifications.map((cert) => (
                  <Badge key={cert} variant="secondary">
                    <Shield className="mr-1 h-3 w-3" />
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <FileText className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{inspectorProfile.stats.totalInspections.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Jobs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Calendar className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{inspectorProfile.stats.thisMonth}</p>
              <p className="text-xs text-muted-foreground">This Month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Star className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold">{inspectorProfile.stats.avgRating}</p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Contact Information</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Contact admin to update these details
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  impactLight();
                  // TODO: Implement request change functionality
                }}
              >
                Request Change
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Mail className="h-5 w-5" />
              <span>{inspectorProfile.email}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Phone className="h-5 w-5" />
              <span>{inspectorProfile.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="h-5 w-5" />
              <span>{inspectorProfile.location}</span>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified about new jobs</p>
                </div>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={() => handleToggle(setNotifications, notifications)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Reduce eye strain</p>
                </div>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={handleDarkModeToggle}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wifi className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Auto-Sync on WiFi</p>
                  <p className="text-sm text-muted-foreground">Save mobile data</p>
                </div>
              </div>
              <Switch
                checked={autoSync}
                onCheckedChange={() => handleToggle(setAutoSync, autoSync)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Storage</CardTitle>
            <CardDescription>Offline data and cached photos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HardDrive className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">1.2 GB used</p>
                  <p className="text-sm text-muted-foreground">of 5 GB available</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => impactLight()}>
                Clear Cache
              </Button>
            </div>
            <Progress value={24} className="h-2" />
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardContent className="p-0">
            <button
              className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              onClick={() => impactLight()}
            >
              <span className="font-medium">Help & Support</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
            <Separator />
            <button
              className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              onClick={() => impactLight()}
            >
              <span className="font-medium">Privacy Policy</span>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
            <Separator />
            <button
              className="flex w-full items-center justify-between p-4 text-left text-destructive hover:bg-muted/50 transition-colors"
              onClick={handleSignOut}
            >
              <span className="font-medium flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </CardContent>
        </Card>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          InspectOS v1.0.0
        </p>
      </div>
    </InspectorShell>
  );
}
