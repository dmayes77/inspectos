"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCreateLead } from "@/hooks/use-leads";
import { toast } from "sonner";
import { ResourceFormLayout } from "@/components/shared/resource-form-layout";
import {
  LeadFormErrors,
  LeadFormSections,
  LeadFormValues,
  createEmptyLeadForm,
  validateLeadForm,
} from "@/components/leads/lead-form-sections";

export default function NewLeadPage() {
  const router = useRouter();
  const createLead = useCreateLead();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<LeadFormValues>(createEmptyLeadForm());
  const [errors, setErrors] = useState<LeadFormErrors>({});

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationErrors = validateLeadForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setIsSubmitting(true);

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      stage: form.stage,
      serviceName: form.serviceName,
      requestedDate: form.requestedDate,
      estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : 0,
      source: form.source,
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
    <>
    <div className="space-y-6">
      <PageHeader
        title="New Lead"
        description="Capture a new inquiry or sales opportunity."
      />

      <form onSubmit={handleSubmit}>
        <ResourceFormLayout
          left={
            <LeadFormSections
              form={form}
              setForm={setForm}
              errors={errors}
              setErrors={setErrors}
            />
          }
          right={
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Create Lead"}
                  </Button>
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <Link href="/admin/leads">Cancel</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>• Required fields are marked with an asterisk (*)</p>
                  <p>• Add service info to help route the lead</p>
                  <p>• Update the stage as the lead progresses</p>
                </CardContent>
              </Card>
            </>
          }
        />
      </form>
    </div>
    </>
  );
}
