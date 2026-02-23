"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Service } from "@/hooks/use-services";
import { Clock, Search } from "lucide-react";

export type InspectorOption = {
  teamMemberId: string;
  name: string;
};

type ServiceGroup = {
  title: string;
  emptyLabel: string;
  services: Service[];
};

type InspectionDetailsSectionProps = {
  inspectors: InspectorOption[];
  selectedInspectorId: string | null;
  onInspectorChange: (value: string | null) => void;
  services: Service[];
  selectedServiceIds: string[];
  onServiceToggle: (serviceId: string, checked: boolean) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  helperText?: string;
  allowUnassigned?: boolean;
  unassignedLabel?: string;
};

export function InspectionDetailsSection({
  inspectors,
  selectedInspectorId,
  onInspectorChange,
  services,
  selectedServiceIds,
  onServiceToggle,
  searchValue,
  onSearchChange,
  helperText,
  allowUnassigned = false,
  unassignedLabel = "Unassigned",
}: InspectionDetailsSectionProps) {
  const normalizedSearch = searchValue?.trim().toLowerCase() ?? "";

  const { coreServices, addonServices, packageServices } = useMemo(() => {
    const filtered = normalizedSearch ? services.filter((service) => service.name.toLowerCase().includes(normalizedSearch)) : services;

    return {
      coreServices: filtered.filter((service) => service.category === "core" && !service.isPackage),
      addonServices: filtered.filter((service) => service.category === "addon" && !service.isPackage),
      packageServices: filtered.filter((service) => service.isPackage),
    };
  }, [services, normalizedSearch]);

  const groups: ServiceGroup[] = [
    { title: "Core Services", emptyLabel: "No core services found.", services: coreServices },
    { title: "Add-ons", emptyLabel: "No add-ons found.", services: addonServices },
    { title: "Packages", emptyLabel: "No packages found.", services: packageServices },
  ];

  const selectValue = selectedInspectorId ?? (allowUnassigned ? "__none__" : undefined);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="inspector_id">Inspector</Label>
        <Select value={selectValue} onValueChange={(value) => onInspectorChange(value === "__none__" ? null : value)}>
          <SelectTrigger id="inspector_id">
            <SelectValue placeholder="Assign inspector" />
          </SelectTrigger>
          <SelectContent>
            {allowUnassigned ? <SelectItem value="__none__">{unassignedLabel}</SelectItem> : null}
            {inspectors.map((inspector) => (
              <SelectItem key={inspector.teamMemberId} value={inspector.teamMemberId}>
                {inspector.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {onSearchChange && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchValue ?? ""} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search services..." className="pl-9" />
        </div>
      )}

      {helperText ? <p className="text-sm text-muted-foreground">{helperText}</p> : null}

      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.title} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{group.title}</Label>
              <Badge color="light">{group.services.length}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {group.services.length === 0 ? (
                <div className="text-sm text-muted-foreground">{group.emptyLabel}</div>
              ) : (
                group.services.map((service) => {
                  const checked = selectedServiceIds.includes(service.serviceId);
                  return (
                    <label key={service.serviceId} className="flex items-start gap-3 rounded-sm border px-3 py-2 hover:bg-muted/50">
                      <Checkbox checked={checked} onCheckedChange={(value) => onServiceToggle(service.serviceId, value === true)} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium">{service.name}</p>
                          <span className="text-sm font-semibold">${Number(service.price ?? 0).toFixed(2)}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {service.durationMinutes ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {service.durationMinutes} min
                            </span>
                          ) : null}
                          {service.templateId ? <span>Template linked</span> : null}
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
