"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save, Eye, FileText, MessageSquare, Mail } from "lucide-react";

// Mock content configuration
const initialContent = {
  landing: {
    heroTitle: "Home Inspection Software That Works Everywhere",
    heroSubtitle: "Complete inspections offline. Generate reports instantly. Get paid faster.",
    ctaText: "Start Free Trial",
    secondaryCtaText: "Watch Demo",
  },
  trial: {
    title: "Start your 30-day free trial",
    description: "Try InspectOS free for 30 days. No commitment required.",
    benefits: [
      "Full access to all features",
      "Unlimited inspections during trial",
      "Cancel anytime before trial ends",
    ],
  },
  emails: {
    welcomeSubject: "Welcome to InspectOS!",
    welcomeBody: "Thank you for joining InspectOS. Here's how to get started...",
    trialEndingSubject: "Your trial ends in 3 days",
    trialEndingBody: "Your InspectOS trial ends soon. Upgrade now to keep access...",
  },
  legal: {
    termsLastUpdated: "2026-01-01",
    privacyLastUpdated: "2026-01-01",
  },
};

export default function PlatformContentPage() {
  const [content, setContent] = useState(initialContent);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateContent = (section: string, field: string, value: string) => {
    setContent((prev) => ({
      ...prev,
      [section]: { ...(prev as Record<string, Record<string, unknown>>)[section], [field]: value },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Content Management</h1>
          <p className="text-slate-400">Edit marketing copy and messaging</p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge className="bg-amber-500/20 text-amber-400">Unsaved changes</Badge>
          )}
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300"
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="landing" className="space-y-6">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="landing" className="data-[state=active]:bg-slate-700">
            <FileText className="mr-2 h-4 w-4" />
            Landing Page
          </TabsTrigger>
          <TabsTrigger value="trial" className="data-[state=active]:bg-slate-700">
            <MessageSquare className="mr-2 h-4 w-4" />
            Trial Messaging
          </TabsTrigger>
          <TabsTrigger value="emails" className="data-[state=active]:bg-slate-700">
            <Mail className="mr-2 h-4 w-4" />
            Email Templates
          </TabsTrigger>
        </TabsList>

        {/* Landing Page Content */}
        <TabsContent value="landing" className="space-y-6">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-white">Hero Section</CardTitle>
              <CardDescription className="text-slate-400">
                Main headline and call-to-action on the landing page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="heroTitle" className="text-white">
                  Headline
                </Label>
                <Input
                  id="heroTitle"
                  value={content.landing.heroTitle}
                  onChange={(e) => updateContent("landing", "heroTitle", e.target.value)}
                  className="border-slate-700 bg-slate-800 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heroSubtitle" className="text-white">
                  Subheadline
                </Label>
                <Textarea
                  id="heroSubtitle"
                  value={content.landing.heroSubtitle}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateContent("landing", "heroSubtitle", e.target.value)}
                  className="border-slate-700 bg-slate-800 text-white"
                  rows={2}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ctaText" className="text-white">
                    Primary CTA Text
                  </Label>
                  <Input
                    id="ctaText"
                    value={content.landing.ctaText}
                    onChange={(e) => updateContent("landing", "ctaText", e.target.value)}
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryCtaText" className="text-white">
                    Secondary CTA Text
                  </Label>
                  <Input
                    id="secondaryCtaText"
                    value={content.landing.secondaryCtaText}
                    onChange={(e) => updateContent("landing", "secondaryCtaText", e.target.value)}
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-white">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-white p-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  {content.landing.heroTitle}
                </h1>
                <p className="mt-4 text-lg text-slate-600">
                  {content.landing.heroSubtitle}
                </p>
                <div className="mt-6 flex justify-center gap-4">
                  <Button>{content.landing.ctaText}</Button>
                  <Button variant="outline">{content.landing.secondaryCtaText}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trial Messaging */}
        <TabsContent value="trial" className="space-y-6">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-white">Trial Signup Messaging</CardTitle>
              <CardDescription className="text-slate-400">
                Content shown during the trial signup flow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trialTitle" className="text-white">
                  Title
                </Label>
                <Input
                  id="trialTitle"
                  value={content.trial.title}
                  onChange={(e) => updateContent("trial", "title", e.target.value)}
                  className="border-slate-700 bg-slate-800 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trialDescription" className="text-white">
                  Description
                </Label>
                <Textarea
                  id="trialDescription"
                  value={content.trial.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateContent("trial", "description", e.target.value)}
                  className="border-slate-700 bg-slate-800 text-white"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Benefits (one per line)</Label>
                <Textarea
                  value={content.trial.benefits.join("\n")}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setContent((prev) => ({
                      ...prev,
                      trial: { ...prev.trial, benefits: e.target.value.split("\n") },
                    }));
                    setHasChanges(true);
                  }}
                  className="border-slate-700 bg-slate-800 text-white"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates */}
        <TabsContent value="emails" className="space-y-6">
          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-white">Welcome Email</CardTitle>
              <CardDescription className="text-slate-400">
                Sent when a user signs up for a trial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcomeSubject" className="text-white">
                  Subject Line
                </Label>
                <Input
                  id="welcomeSubject"
                  value={content.emails.welcomeSubject}
                  onChange={(e) => updateContent("emails", "welcomeSubject", e.target.value)}
                  className="border-slate-700 bg-slate-800 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeBody" className="text-white">
                  Email Body
                </Label>
                <Textarea
                  id="welcomeBody"
                  value={content.emails.welcomeBody}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateContent("emails", "welcomeBody", e.target.value)}
                  className="border-slate-700 bg-slate-800 text-white"
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900">
            <CardHeader>
              <CardTitle className="text-white">Trial Ending Email</CardTitle>
              <CardDescription className="text-slate-400">
                Sent 3 days before trial expires
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trialEndingSubject" className="text-white">
                  Subject Line
                </Label>
                <Input
                  id="trialEndingSubject"
                  value={content.emails.trialEndingSubject}
                  onChange={(e) => updateContent("emails", "trialEndingSubject", e.target.value)}
                  className="border-slate-700 bg-slate-800 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trialEndingBody" className="text-white">
                  Email Body
                </Label>
                <Textarea
                  id="trialEndingBody"
                  value={content.emails.trialEndingBody}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateContent("emails", "trialEndingBody", e.target.value)}
                  className="border-slate-700 bg-slate-800 text-white"
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
