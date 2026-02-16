"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/layout/page-header";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useServices, useUpdateService, type Service } from "@/hooks/use-services";
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

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id;

  const { data: allServices = [] } = useServices();
  const service = useMemo(() => allServices.find((svc) => svc.serviceId === serviceId), [allServices, serviceId]);
  const individualServices = useMemo(() => allServices.filter((svc) => !svc.isPackage), [allServices]);
  const { data: templatesData = [] } = useTemplates();
  const templates = templatesData.filter((template) => template.type === "inspection");

  const updateService = useUpdateService();
  const createTemplateStub = useCreateTemplateStub();

  const [form, setForm] = useState<Partial<Service>>({});
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [templateMode, setTemplateMode] = useState<"existing" | "new">("existing");
  const [templateSelection, setTemplateSelection] = useState("none");
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    if (!service) return;
    setForm({
      name: service.name,
      description: service.description ?? "",
      price: service.price,
      durationMinutes: service.durationMinutes,
      category: service.category ?? "core",
      status: service.status ?? "active",
      includes: service.includes ?? [],
      templateId: service.templateId ?? null,
      isPackage: service.isPackage,
      includedServiceIds: service.includedServiceIds,
    });
    setSelectedServiceIds(service.includedServiceIds ?? []);
    setTemplateSelection(service.templateId ?? "none");
  }, [service?.serviceId]);

  if (!service) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isPackage = Boolean(service.isPackage);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPackage && selectedServiceIds.length === 0) {
      toast.error("Select at least one service for this package.");
      return;
    }

    let templateId: string | null = form.templateId ?? service.templateId ?? null;
    if (!isPackage) {
      if (templateMode === "new") {
        if (!templateName.trim()) {
          toast.error("Please provide a template name.");
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
      templateId,
      includedServiceIds: isPackage ? selectedServiceIds : form.includedServiceIds,
    };

    updateService.mutate(
      { serviceId: service.serviceId, ...payload },
      {
        onSuccess: () => {
          toast.success("Service updated");
          router.push(`/admin/services/${service.serviceId}`);
        },
        onError: (error: unknown) => {
          const message = error instanceof Error ? error.message : "Failed to update service";
          toast.error(message);
        },
      },
    );
  };

  return (
    <>
    <div className="space-y-6">
      <PageHeader
        title={isPackage ? "Edit Package" : "Edit Service"}
        description={isPackage ? "Adjust the included services and pricing." : "Update the service details."}
      />

      <ServiceForm
        title={isPackage ? "Edit Package" : "Edit Service"}
        description={isPackage ? "Update the services included and pack details." : "Adjust the service information."}
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
        onCancel={() => router.push(`/admin/services/${service.serviceId}`)}
        primaryLabel={isPackage ? "Save Package" : "Save Service"}
        pendingLabel={isPackage ? "Saving package..." : "Saving..."}
        cancelLabel="Cancel"
        tips={isPackage ? PACKAGE_TIPS : SERVICE_TIPS}
        isPending={updateService.isPending}
      />
    </div>
    </>
  );
}
