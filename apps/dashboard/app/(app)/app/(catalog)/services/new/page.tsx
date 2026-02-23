"use client";

import type { FormEvent } from "react";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/layout/page-header";
import { toast } from "sonner";

import { Service } from "@/hooks/use-services";
import { useCreateService, useServices } from "@/hooks/use-services";
import { useTemplates, useCreateTemplateStub } from "@/hooks/use-templates";
import { ServiceForm } from "@/components/shared/service-form";

const SERVICE_TIPS = [
  "Use durations and price together to keep scheduling accurate.",
  "Mark add-ons if this task should not count toward package pricing.",
  "Link a template to reuse inspection defaults.",
];

const PACKAGE_TIPS = [
  "Discount buttons auto-calc package pricing and keep rates consistent.",
  "Highlight core services so clients know what’s included.",
  "Packages must include services before you can save.",
];

type ServiceMode = "service" | "package";

export default function NewServicePage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Loading service builder...</div>}>
      <NewServicePageContent />
    </Suspense>
  );
}

function NewServicePageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const modeParam = params.get("mode");
  const mode: ServiceMode = modeParam === "package" ? "package" : "service";

  const { data: allServices = [] } = useServices();
  const individualServices = useMemo(() => allServices.filter((service) => !service.isPackage), [allServices]);
  const { data: templatesData = [] } = useTemplates();
  const templates = templatesData.filter((template) => template.type === "inspection");

  const createService = useCreateService();
  const createTemplateStub = useCreateTemplateStub();

  const [form, setForm] = useState<Partial<Service>>({
    category: "core",
    isPackage: mode === "package",
    status: "active",
  });
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [templateMode, setTemplateMode] = useState<"existing" | "new">("existing");
  const [templateSelection, setTemplateSelection] = useState("none");
  const [templateName, setTemplateName] = useState("");

  const isPackage = mode === "package";
  const tips = isPackage ? PACKAGE_TIPS : SERVICE_TIPS;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPackage && selectedServiceIds.length === 0) {
      toast.error("Select at least one service for this package.");
      return;
    }

    let templateId: string | null = null;
    if (!isPackage) {
      if (templateMode === "new") {
        if (!templateName.trim()) {
          toast.error("Please provide a name for the new template.");
          return;
        }
        try {
          const stub = await createTemplateStub.mutateAsync({ name: templateName.trim() });
          templateId = stub.id;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to create template";
          toast.error(message);
          return;
        }
      } else {
        templateId = templateSelection && templateSelection !== "none" ? templateSelection : null;
      }
    }

    const payload: Partial<Service> = {
      ...form,
      isPackage,
      category: isPackage ? undefined : (form.category ?? "core"),
      status: form.status ?? "active",
      templateId,
      includedServiceIds: isPackage ? selectedServiceIds : undefined,
    };

    createService.mutate(payload, {
      onSuccess: (result) => {
        toast.success(`${isPackage ? "Package" : "Service"} created`);
        router.push(`/app/services/${result.serviceId}`);
      },
      onError: (error: unknown) => {
        const message = error instanceof Error ? error.message : "Failed to create service";
        toast.error(message);
      },
    });
  };

  return (
    <>
    <div className="space-y-6">
      <PageHeader
        title={isPackage ? "Add Package" : "Add Service"}
        description={isPackage ? "Bundle services with a custom price" : "Create a standalone service"}
      />

      <ServiceForm
        title={isPackage ? "Create Package" : "Create Service"}
        description={isPackage ? "Select the services to include in this package." : "Define service details and pricing."}
        form={form}
        setForm={setForm}
        services={individualServices}
        selectedServiceIds={selectedServiceIds}
        setSelectedServiceIds={setSelectedServiceIds}
        discountPercent={discountPercent}
        setDiscountPercent={setDiscountPercent}
        isPackage={isPackage}
        showTemplate={!isPackage}
        templates={templates}
        templateMode={templateMode}
        setTemplateMode={setTemplateMode}
        templateSelection={templateSelection}
        setTemplateSelection={setTemplateSelection}
        templateName={templateName}
        setTemplateName={setTemplateName}
        onSubmit={handleSubmit}
        onCancel={() => router.push("/app/services")}
        primaryLabel={isPackage ? "Create Package" : "Create Service"}
        pendingLabel={isPackage ? "Creating package..." : "Creating..."}
        cancelLabel="Cancel"
        tips={tips}
        isPending={createService.isPending}
      />
    </div>
    </>
  );
}
