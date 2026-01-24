"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLead } from "@/hooks/use-leads";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { toast } from "sonner";

const stageOptions = [
  { value: "new", label: "New" },
  { value: "qualified", label: "Qualified" },
  { value: "quoted", label: "Quoted" },
  { value: "scheduled", label: "Scheduled" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export default function NewLeadPage() {
  const router = useRouter();
  const createLead = useCreateLead();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState("new");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      stage,
      serviceName: formData.get("serviceName") as string,
      requestedDate: formData.get("requestedDate") as string,
      estimatedValue: formData.get("estimatedValue") ? Number(formData.get("estimatedValue")) : 0,
      source: formData.get("source") as string,
    };

    try {
      const result = await createLead.mutateAsync(payload);
      toast.success("Lead created.");
      router.push(`/admin/leads/${result.leadId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create lead.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6 max-w-2xl">
        <BackButton href="/admin/leads" label="Back to Leads" variant="ghost" />

        <AdminPageHeader title="New Lead" description="Capture a new inquiry or sales opportunity." />

        <Card>
          <CardHeader>
            <CardTitle>Lead Details</CardTitle>
            <CardDescription>Enter contact and request info.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" type="tel" />
              </div>
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceName">Service</Label>
                <Input id="serviceName" name="serviceName" placeholder="Full Home Inspection" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requestedDate">Requested date</Label>
                <Input id="requestedDate" name="requestedDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedValue">Estimated value</Label>
                <Input id="estimatedValue" name="estimatedValue" type="number" min="0" step="1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input id="source" name="source" placeholder="Website, referral, Zillow" />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Create Lead"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/admin/leads">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
