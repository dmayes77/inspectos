"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { useCreateClient } from "@/hooks/use-clients";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { ResourceFormLayout } from "@/components/shared/resource-form-layout";
import { ResourceFormSidebar } from "@/components/shared/resource-form-sidebar";
import {
  ContactFormErrors,
  ContactFormSections,
  ContactFormValues,
  createEmptyContactForm,
  validateContactForm,
} from "@/components/contacts/contact-form-sections";

export default function NewClientPage() {
  const router = useRouter();
  const createClient = useCreateClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<ContactFormValues>(createEmptyContactForm());
  const [errors, setErrors] = useState<ContactFormErrors>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validateContactForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setIsSubmitting(true);

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      type: form.type,
      inspections: 0,
      lastInspection: "Never",
      totalSpent: 0,
      createdAt: null,
      updatedAt: null,
    };

    try {
      const result = await createClient.mutateAsync(payload);
      setIsSubmitting(false);
      router.push(`/admin/contacts/clients/${result.clientId}`);
    } catch (err) {
      setIsSubmitting(false);
      console.error("Failed to create client:", err);
    }
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <PageHeader
          breadcrumb={
            <>
              <Link href="/admin/overview" className="hover:text-foreground">
                Overview
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/admin/contacts" className="hover:text-foreground">
                Contacts
              </Link>
            </>
          }
          title="New Client"
          description="Add a new client to your database"
          backHref="/admin/contacts"
        />

        <form onSubmit={handleSubmit}>
          <ResourceFormLayout
            left={
              <ContactFormSections
                form={form}
                setForm={setForm}
                errors={errors}
                setErrors={setErrors}
                title="Client Information"
                description="Enter the client details below"
              />
            }
            right={
              <ResourceFormSidebar
                actions={
                  <>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Creating..." : "Create Client"}
                    </Button>
                    <Button type="button" variant="outline" className="w-full" asChild>
                      <Link href="/admin/contacts">Cancel</Link>
                    </Button>
                  </>
                }
                tips={[
                  "• Required fields are marked with an asterisk (*)",
                  "• Keep phone numbers formatted for easy calling",
                  "• Contact types help with segmentation",
                ]}
              />
            }
          />
        </form>
      </div>
    </AdminShell>
  );
}
