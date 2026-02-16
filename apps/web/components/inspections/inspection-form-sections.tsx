"use client";

import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { InspectionDetailsSection, type InspectorOption } from "./inspection-details-section";
import { calculateServiceDurationMinutes, calculateServiceTotal, formatPrice } from "@inspectos/shared/utils/pricing";
import type { Service } from "@/hooks/use-services";

export type InspectionFormState = {
  inspectorId: string | null;
  serviceIds: string[];
  status: string;
  price: string;
  notes: string;
};

export type InspectionFormErrors = Partial<{
  inspectorId: string;
  serviceIds: string;
  status: string;
  price: string;
  notes: string;
}>;

export const INSPECTION_STATUS_OPTIONS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending_report", label: "Pending Report" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export type InspectionStatusOption = (typeof INSPECTION_STATUS_OPTIONS)[number];

export function createEmptyInspectionFormState(initial?: Partial<InspectionFormState>): InspectionFormState {
  return {
    inspectorId: null,
    serviceIds: [],
    status: "scheduled",
    price: "0.00",
    notes: "",
    ...initial,
  };
}

export function validateInspectionForm(form: InspectionFormState): InspectionFormErrors {
  const errors: InspectionFormErrors = {};

  if (!Array.isArray(form.serviceIds) || form.serviceIds.length === 0) {
    errors.serviceIds = "Select at least one service.";
  }

  if (!form.status.trim()) {
    errors.status = "Status is required.";
  }

  if (!form.price.trim()) {
    errors.price = "Price is required.";
  } else if (Number.isNaN(Number.parseFloat(form.price))) {
    errors.price = "Price must be a number.";
  }

  return errors;
}

type InspectionFormSectionsProps = {
  form: InspectionFormState;
  setForm: Dispatch<SetStateAction<InspectionFormState>>;
  inspectors: InspectorOption[];
  services: Service[];
  errors?: InspectionFormErrors;
  helperText?: string;
  allowUnassignedInspector?: boolean;
  unassignedInspectorLabel?: string;
  statusOptions?: readonly InspectionStatusOption[];
  serviceSearchValue?: string;
  onServiceSearchChange?: (value: string) => void;
  metadataDescription?: string;
  showNotesField?: boolean;
  showPriceField?: boolean;
  autoCalculatePrice?: boolean;
};

export function InspectionFormSections({
  form,
  setForm,
  inspectors,
  services,
  errors,
  helperText,
  allowUnassignedInspector = false,
  unassignedInspectorLabel = "Unassigned",
  statusOptions = INSPECTION_STATUS_OPTIONS,
  serviceSearchValue,
  onServiceSearchChange,
  metadataDescription = "Track progress and internal notes for this inspection.",
  showNotesField = true,
  showPriceField = true,
  autoCalculatePrice = true,
}: InspectionFormSectionsProps) {
  const [localSearch, setLocalSearch] = useState("");
  const resolvedSearchValue = serviceSearchValue ?? localSearch;
  const handleSearchChange = onServiceSearchChange ?? setLocalSearch;

  const selectedPrice = useMemo(() => calculateServiceTotal(form.serviceIds, services), [form.serviceIds, services]);
  const selectedDuration = useMemo(() => calculateServiceDurationMinutes(form.serviceIds, services), [form.serviceIds, services]);

  useEffect(() => {
    if (!autoCalculatePrice) return;
    const nextPrice = selectedPrice.toFixed(2);
    setForm((prev) => {
      if (prev.price === nextPrice) {
        return prev;
      }
      return { ...prev, price: nextPrice };
    });
  }, [autoCalculatePrice, selectedPrice, setForm]);

  const handleInspectorChange = (value: string | null) => {
    setForm((prev) => {
      if (prev.inspectorId === value) {
        return prev;
      }
      return { ...prev, inspectorId: value };
    });
  };

  const handleServiceToggle = (serviceId: string, checked: boolean) => {
    setForm((prev) => {
      const nextServiceIds = checked ? Array.from(new Set([...prev.serviceIds, serviceId])) : prev.serviceIds.filter((id) => id !== serviceId);

      if (nextServiceIds.length === prev.serviceIds.length && nextServiceIds.every((id, index) => id === prev.serviceIds[index])) {
        return prev;
      }

      return { ...prev, serviceIds: nextServiceIds };
    });
  };

  const resolvedPriceDisplay = autoCalculatePrice ? selectedPrice : Number.parseFloat(form.price || "0");
  const formattedPrice = formatPrice(Number.isFinite(resolvedPriceDisplay) ? resolvedPriceDisplay : 0);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Assignment & Services</CardTitle>
          <CardDescription>Pick an inspector and bundle services into this inspection.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InspectionDetailsSection
            inspectors={inspectors}
            selectedInspectorId={form.inspectorId}
            onInspectorChange={handleInspectorChange}
            services={services}
            selectedServiceIds={form.serviceIds}
            onServiceToggle={handleServiceToggle}
            searchValue={resolvedSearchValue}
            onSearchChange={handleSearchChange}
            helperText={helperText}
            allowUnassigned={allowUnassignedInspector}
            unassignedLabel={unassignedInspectorLabel}
          />
          {errors?.inspectorId ? <p className="text-sm text-destructive">{errors.inspectorId}</p> : null}
          {errors?.serviceIds ? <p className="text-sm text-destructive">{errors.serviceIds}</p> : null}

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Services</p>
              <p className="text-lg font-semibold">{form.serviceIds.length || 0}</p>
              <p className="text-xs text-muted-foreground">selected</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Duration</p>
              <p className="text-lg font-semibold">{selectedDuration ? `${selectedDuration} min` : "—"}</p>
              <p className="text-xs text-muted-foreground">estimated</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Price</p>
              <p className="text-lg font-semibold">{formattedPrice}</p>
              <p className="text-xs text-muted-foreground">{autoCalculatePrice ? "auto" : "manual"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status & Notes</CardTitle>
          <CardDescription>{metadataDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inspection-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((prev) => {
                    if (prev.status === value) {
                      return prev;
                    }
                    return { ...prev, status: value };
                  })
                }
              >
                <SelectTrigger id="inspection-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors?.status ? <p className="text-sm text-destructive">{errors.status}</p> : null}
            </div>

            {showPriceField ? (
              <div className="space-y-2">
                <Label htmlFor="inspection-price">Price ($)</Label>
                <Input
                  id="inspection-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={autoCalculatePrice ? selectedPrice : form.price}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      price: event.target.value,
                    }))
                  }
                  readOnly={autoCalculatePrice}
                />
                {autoCalculatePrice ? <p className="text-xs text-muted-foreground">Auto-calculated from selected services.</p> : null}
                {errors?.price ? <p className="text-sm text-destructive">{errors.price}</p> : null}
              </div>
            ) : null}
          </div>

          {showNotesField ? (
            <div className="space-y-2">
              <Label htmlFor="inspection-notes">Notes</Label>
              <Textarea
                id="inspection-notes"
                rows={4}
                value={form.notes}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    notes: event.target.value,
                  }))
                }
                placeholder="Add access instructions, hazards, or context for the inspector."
              />
              {errors?.notes ? <p className="text-sm text-destructive">{errors.notes}</p> : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Badge color="light">Status: {statusOptions.find((option) => option.value === form.status)?.label ?? form.status}</Badge>
            <Badge color="light">Inspector {form.inspectorId ? "assigned" : allowUnassignedInspector ? "optional" : "required"}</Badge>
            <Badge color="light">{form.serviceIds.length} services</Badge>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
