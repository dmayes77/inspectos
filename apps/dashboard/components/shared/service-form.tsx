"use client";

import { Dispatch, SetStateAction, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResourceFormLayout } from "@/components/shared/resource-form-layout";
import { ResourceFormSidebar } from "@/components/shared/resource-form-sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { IncludesEditor } from "@/components/ui/includes-editor";
import { Loader2, Save } from "lucide-react";
import { Service } from "@/hooks/use-services";
import type { Template } from "@/types/template";
import { calculatePackageDiscount } from "@inspectos/shared/utils/pricing";

const durationOptions = [30, 60, 90, 120, 180, 240, 300];

type ServiceFormProps = {
  title: string;
  description?: string;
  form: Partial<Service>;
  setForm: Dispatch<SetStateAction<Partial<Service>>>;
  services: Service[];
  selectedServiceIds: string[];
  setSelectedServiceIds: Dispatch<SetStateAction<string[]>>;
  discountPercent: number;
  setDiscountPercent: Dispatch<SetStateAction<number>>;
  isPackage?: boolean;
  showTemplate?: boolean;
  templates?: Template[];
  templateMode?: "existing" | "new";
  setTemplateMode?: Dispatch<SetStateAction<"existing" | "new">>;
  templateSelection?: string;
  setTemplateSelection?: Dispatch<SetStateAction<string>>;
  templateName?: string;
  setTemplateName?: Dispatch<SetStateAction<string>>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  primaryLabel: string;
  pendingLabel?: string;
  cancelLabel?: string;
  tips?: string[];
  isPending: boolean;
};

const formatDuration = (minutes?: number) => {
  if (!minutes) return "—";
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
};

export function ServiceForm({
  title,
  description,
  form,
  setForm,
  services,
  selectedServiceIds,
  setSelectedServiceIds,
  discountPercent,
  setDiscountPercent,
  isPackage = false,
  showTemplate = true,
  templates = [],
  templateMode = "existing",
  setTemplateMode,
  templateSelection = "",
  setTemplateSelection,
  templateName = "",
  setTemplateName,
  onSubmit,
  onCancel,
  primaryLabel,
  pendingLabel,
  cancelLabel = "Cancel",
  tips = [],
  isPending,
}: ServiceFormProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceSelect = (serviceId: string, checked: boolean) => {
    const updated = checked ? [...selectedServiceIds, serviceId] : selectedServiceIds.filter((id) => id !== serviceId);
    setSelectedServiceIds(updated);
    if (isPackage) {
      const combinedIncludes = updated.flatMap((id) => services.find((svc) => svc.serviceId === id)?.includes || []);
      const uniqueIncludes = Array.from(new Set(combinedIncludes));
      const totalDuration = updated.reduce(
        (sum, id) => sum + (services.find((svc) => svc.serviceId === id)?.durationMinutes || 0),
        0
      );
      setForm((prev) => ({
        ...prev,
        includes: uniqueIncludes,
        durationMinutes: totalDuration || prev.durationMinutes,
      }));
    }
  };

  const handleDiscountChange = (percent: number) => {
    setDiscountPercent(percent);
    const totalIndividual = selectedServiceIds.reduce((sum, id) => {
      const svc = services.find((service) => service.serviceId === id);
      return sum + (svc?.price || 0);
    }, 0);
    const discounted = totalIndividual * (1 - percent / 100);
    const roundedValue = Math.ceil(discounted / 5) * 5;
    setForm((prev) => ({ ...prev, price: roundedValue }));
  };

  const packageDiscount = useMemo(() => {
    if (!isPackage || selectedServiceIds.length === 0) {
      return { totalIndividualPrice: 0, packagePrice: 0, discount: 0, discountPercent: 0 };
    }
    const serviceList = selectedServiceIds
      .map((id) => services.find((service) => service.serviceId === id))
      .filter((svc): svc is Service => Boolean(svc));
    return calculatePackageDiscount(
      {
        serviceId: "",
        name: form.name || "",
        price: Number(form.price) || 0,
        isPackage: true,
        includedServiceIds: selectedServiceIds,
      },
      serviceList
    );
  }, [isPackage, selectedServiceIds, services, form.name, form.price]);

  return (
    <Card className="my-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit}>
          <ResourceFormLayout
            left={
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input name="name" value={form.name || ""} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    name="description"
                    value={form.description || ""}
                    onChange={handleChange}
                    placeholder="Brief overview of the service"
                    rows={2}
                  />
                </div>
                {!isPackage && (
                  <>
                    <IncludesEditor
                      includes={form.includes || []}
                      onChange={(includes) => setForm((prev) => ({ ...prev, includes }))}
                    />
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <div className="flex flex-wrap gap-2">
                        {durationOptions.map((minutes) => (
                          <Button
                            key={minutes}
                            type="button"
                            size="sm"
                            variant={form.durationMinutes === minutes ? "primary" : "outline"}
                            onClick={() => setForm((prev) => ({ ...prev, durationMinutes: minutes }))}
                          >
                            {formatDuration(minutes)}
                          </Button>
                        ))}
                      </div>
                      <div className="max-w-[200px]">
                        <Input
                          type="number"
                          min={0.5}
                          step={0.5}
                          value={form.durationMinutes ? form.durationMinutes / 60 : ""}
                          onChange={(event) => {
                            const hours = Number(event.target.value);
                            if (!Number.isFinite(hours)) {
                              setForm((prev) => ({ ...prev, durationMinutes: undefined }));
                              return;
                            }
                            setForm((prev) => ({
                              ...prev,
                              durationMinutes: Math.max(30, Math.round(hours * 60)),
                            }));
                          }}
                          placeholder="Hours (e.g., 4)"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={form.category === "addon"}
                          onCheckedChange={(checked) =>
                            setForm((prev) => ({ ...prev, category: checked ? "addon" : "core" }))
                          }
                        />
                        Mark as add-on service
                      </label>
                    </div>
                    {showTemplate && templates.length > 0 && (
                      <div className="space-y-2">
                        <Label>Template</Label>
                        <Select value={templateMode} onValueChange={(value) => setTemplateMode?.(value as "existing" | "new")}>
                          <SelectTrigger className="max-w-xs">
                            <SelectValue placeholder="Choose template option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="existing">Link existing template</SelectItem>
                            <SelectItem value="new">Create new template</SelectItem>
                          </SelectContent>
                        </Select>
                        {templateMode === "existing" ? (
                          <Select value={templateSelection} onValueChange={setTemplateSelection}>
                            <SelectTrigger className="max-w-xs">
                              <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64 overflow-y-auto">
                              <SelectItem value="none">No template</SelectItem>
                              {templates.map((template) => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={templateName}
                            onChange={(event) => setTemplateName?.(event.target.value ?? "")}
                            placeholder="New template name"
                            className="max-w-xs"
                          />
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Price ($)</Label>
                      <Input
                        name="price"
                        type="number"
                        value={form.price ?? ""}
                        onChange={handleChange}
                        min={0}
                        step="0.01"
                      />
                    </div>
                  </>
                )}
                {isPackage && (
                  <>
                    <div className="space-y-2">
                      <Label>Included Services (select at least one)</Label>
                      <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
                        {services.map((svc) => (
                          <label key={svc.serviceId} className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedServiceIds.includes(svc.serviceId)}
                              onCheckedChange={(checked) => handleServiceSelect(svc.serviceId, checked as boolean)}
                            />
                            <span className="text-sm">
                              {svc.name}
                              {svc.price && <span className="text-muted-foreground ml-1">(${svc.price.toFixed(2)})</span>}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Total Duration</Label>
                      <Input value={`${form.durationMinutes || 0} minutes`} readOnly />
                    </div>
                    {selectedServiceIds.length > 0 && (
                      <div className="space-y-2">
                        <Label>Package Discount</Label>
                        <div className="flex flex-wrap gap-2">
                          {[0, 5, 10, 15, 20].map((percent) => (
                            <label
                              key={percent}
                              className={`flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer transition-colors ${
                                discountPercent === percent
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background hover:bg-accent"
                              }`}
                            >
                              <input
                                type="radio"
                                name="discount"
                                value={percent}
                                checked={discountPercent === percent}
                                onChange={() => handleDiscountChange(percent)}
                                className="sr-only"
                              />
                              <span className="text-sm font-medium">
                                {percent === 0 ? "No Discount" : `${percent}% Off`}
                              </span>
                            </label>
                          ))}
                        </div>
                        {discountPercent > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Price will be auto-calculated: $
                            {Math.ceil(
                              (selectedServiceIds.reduce((sum, id) => {
                                const svc = services.find((service) => service.serviceId === id);
                                return sum + (svc?.price || 0);
                              }, 0) *
                                (1 - discountPercent / 100)) /
                                5
                            ) * 5}
                          </p>
                        )}
                      </div>
                    )}
                    <IncludesEditor
                      includes={form.includes || []}
                      onChange={(includes) => setForm((prev) => ({ ...prev, includes }))}
                    />
                    <div className="space-y-2">
                      <Label>
                        Package Price ($){" "}
                        {discountPercent > 0 && (
                          <span className="text-muted-foreground font-normal">(auto-calculated, editable)</span>
                        )}
                      </Label>
                      <Input
                        name="price"
                        type="number"
                        value={form.price ?? ""}
                        onChange={handleChange}
                        min={0}
                        step="1"
                        required
                      />
                      <p className="text-xs text-muted-foreground">Total duration: {formatDuration(form.durationMinutes)}</p>
                      {selectedServiceIds.length > 0 && form.price && (
                        <div className="text-sm space-y-1 mt-2 p-3 bg-muted/50 rounded-md">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Individual services total:</span>
                            <span className="font-medium">${packageDiscount.totalIndividualPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Package price:</span>
                            <span className="font-medium">${packageDiscount.packagePrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className={packageDiscount.discount > 0 ? "text-green-600 font-medium" : "text-muted-foreground"}>
                              {packageDiscount.discount > 0 ? "Savings:" : "No discount"}
                            </span>
                            {packageDiscount.discount > 0 && (
                              <span className="text-green-600 font-medium">
                                ${packageDiscount.discount.toFixed(2)} ({packageDiscount.discountPercent}% off)
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            }
            right={
              <ResourceFormSidebar
                actions={
                  <>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {pendingLabel ?? `${primaryLabel}ing...`}
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {primaryLabel}
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={onCancel}>
                      {cancelLabel}
                    </Button>
                  </>
                }
                tips={tips}
              />
            }
          />
        </form>
      </CardContent>
    </Card>
  );
}
