"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WebhookForm } from "@/components/webhooks/webhook-form";

export default function NewWebhookPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/webhooks");
  };

  const handleCancel = () => {
    router.push("/webhooks");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={
          <>
            <Link href="/overview" className="hover:text-foreground">
              Overview
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link href="/automations" className="hover:text-foreground">
              Automations
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link href="/webhooks" className="hover:text-foreground">
              Webhooks
            </Link>
            <span className="text-muted-foreground">/</span>
            <span>Create</span>
          </>
        }
        title="Create Webhook"
        description="Configure a webhook to receive real-time event notifications."
        backHref="/webhooks"
      />

      <Card>
        <CardHeader>
          <CardTitle>Webhook Details</CardTitle>
          <CardDescription>
            Connect to Zapier, Make, or any custom endpoint to receive webhook events.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <WebhookForm mode="create" onSuccess={handleSuccess} onCancel={handleCancel} />
        </CardContent>
      </Card>
    </div>
  );
}
