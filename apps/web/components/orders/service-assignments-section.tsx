"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Service } from "@/hooks/use-services";
import { Clock, Search, User, Building2 } from "lucide-react";

export type InspectorOption = {
  teamMemberId: string;
  name: string;
};

export type VendorOption = {
  id: string;
  name: string;
  vendor_type?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type ServiceAssignment = {
  serviceId: string;
  selected: boolean;
  inspectorId: string | null;
  vendorId: string | null;
};

type ServiceGroup = {
  title: string;
  emptyLabel: string;
  services: Service[];
};

type ServiceAssignmentsSectionProps = {
  inspectors: InspectorOption[];
  vendors: VendorOption[];
  services: Service[];
  serviceAssignments: ServiceAssignment[];
  onServiceToggle: (serviceId: string, checked: boolean) => void;
  onServiceInspectorChange: (serviceId: string, inspectorId: string | null) => void;
  onServiceVendorChange: (serviceId: string, vendorId: string | null) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  helperText?: string;
};

export function ServiceAssignmentsSection({
  inspectors,
  vendors,
  services,
  serviceAssignments,
  onServiceToggle,
  onServiceInspectorChange,
  onServiceVendorChange,
  searchValue,
  onSearchChange,
  helperText,
}: ServiceAssignmentsSectionProps) {
  const normalizedSearch = searchValue?.trim().toLowerCase() ?? "";

  const assignmentMap = useMemo(() => {
    const map = new Map<string, ServiceAssignment>();
    serviceAssignments.forEach((assignment) => {
      map.set(assignment.serviceId, assignment);
    });
    return map;
  }, [serviceAssignments]);

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

  return (
    <div className="space-y-4">
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
              <Badge variant="outline">{group.services.length}</Badge>
            </div>
            <div className="space-y-3">
              {group.services.length === 0 ? (
                <div className="text-sm text-muted-foreground">{group.emptyLabel}</div>
              ) : (
                group.services.map((service) => {
                  const assignment = assignmentMap.get(service.serviceId);
                  const checked = assignment?.selected ?? false;
                  const inspectorId = assignment?.inspectorId ?? null;
                  const vendorId = assignment?.vendorId ?? null;

                  return (
                    <div key={service.serviceId} className="rounded-md border">
                      <label className="flex items-start gap-3 px-3 py-2 hover:bg-muted/50">
                        <Checkbox checked={checked} onCheckedChange={(value) => onServiceToggle(service.serviceId, value === true)} />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium">{service.name}</p>
                            <span className="text-sm font-semibold">${Number(service.price ?? 0).toFixed(2)}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {service.durationMinutes ? (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {service.durationMinutes} min
                              </span>
                            ) : null}
                            {service.templateId ? <span>Template linked</span> : null}
                          </div>

                          {checked && (
                            <div className="grid gap-2 pt-2 md:grid-cols-2">
                              <div className="space-y-1">
                                <Label htmlFor={`inspector-${service.serviceId}`} className="text-xs flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Inspector
                                </Label>
                                <Select
                                  value={inspectorId ?? "__none__"}
                                  onValueChange={(value) => onServiceInspectorChange(service.serviceId, value === "__none__" ? null : value)}
                                >
                                  <SelectTrigger id={`inspector-${service.serviceId}`} className="h-8 text-xs">
                                    <SelectValue placeholder="Assign inspector" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">Unassigned</SelectItem>
                                    {inspectors.map((inspector) => (
                                      <SelectItem key={inspector.teamMemberId} value={inspector.teamMemberId}>
                                        {inspector.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-1">
                                <Label htmlFor={`vendor-${service.serviceId}`} className="text-xs flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  Vendor
                                </Label>
                                <Select
                                  value={vendorId ?? "__none__"}
                                  onValueChange={(value) => onServiceVendorChange(service.serviceId, value === "__none__" ? null : value)}
                                >
                                  <SelectTrigger id={`vendor-${service.serviceId}`} className="h-8 text-xs">
                                    <SelectValue placeholder="Assign vendor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">Unassigned</SelectItem>
                                    {vendors.map((vendor) => (
                                      <SelectItem key={vendor.id} value={vendor.id}>
                                        {vendor.name}
                                        {vendor.vendor_type ? ` (${vendor.vendor_type})` : ""}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
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
