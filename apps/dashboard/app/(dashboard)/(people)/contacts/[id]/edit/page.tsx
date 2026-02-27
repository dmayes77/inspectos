"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { PageHeader } from "@/layout/page-header";
import { Button } from "@/components/ui/button";
import { useClientById, useUpdateClient, type Client } from "@/hooks/use-clients";
import { ResourceFormLayout } from "@/components/shared/resource-form-layout";
import { ResourceFormSidebar } from "@/components/shared/resource-form-sidebar";
import { ContactFormErrors, ContactFormSections, ContactFormValues, validateContactForm } from "@/components/contacts/contact-form-sections";
import { toSlugIdSegment } from "@/lib/routing/slug-id";

export default function EditContactPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { id } = params as { id: string };

  const { data: client, isLoading } = useClientById(id);
  const updateClient = useUpdateClient();

  const [form, setForm] = useState<ContactFormValues>({
    name: "",
    email: "",
    phone: "",
    type: "",
  });
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (pathname.endsWith("/edit")) {
      router.replace(pathname.slice(0, -5));
    }
  }, [pathname, router]);

  if (pathname.endsWith("/edit")) {
    return null;
  }

  const initializeForm = (nextClient: Client) => {
    setForm({
      name: nextClient.name ?? "",
      email: nextClient.email ?? "",
      phone: nextClient.phone ?? "",
      type: nextClient.type ?? "",
    });
  };

  useEffect(() => {
    if (client) {
      initializeForm(client);
    }
  }, [client]);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">Loading client...</div>
    );
  }

  if (!client) {
    return (
      <PageHeader
        title="Client Not Found"
        description="The client you're looking for doesn't exist or you don't have access."
      />
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationErrors = validateContactForm(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }
    setIsSaving(true);

    await updateClient.mutateAsync({
      clientId: client.clientId,
      name: form.name,
      email: form.email,
      phone: form.phone,
      type: form.type,
    });

    setIsSaving(false);
    router.push(`/contacts/${toSlugIdSegment(client.name, client.publicId ?? client.clientId)}`);
  };

  return (
    <>
    <div className="space-y-6">
      <PageHeader
        title="Client"
        description="Update client information"
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
              description="Update the client details below"
            />
          }
          right={
            <ResourceFormSidebar
              actions={
                <>
                  <Button type="submit" className="w-full" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <Link href={`/contacts/${toSlugIdSegment(client.name, client.publicId ?? client.clientId)}`}>Cancel</Link>
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
    </>
  );
}
