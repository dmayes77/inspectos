"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowUp, ArrowDown, X, Pencil } from "lucide-react";
import { useTemplate, useUpdateTemplate } from "@/hooks/use-templates";
import { useServices } from "@/hooks/use-services";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TagAssignmentEditor } from "@/components/tags/tag-assignment-editor";
import type { Template, TemplateItemType, TemplateSection } from "@/types/template";
import { toast } from "sonner";

const itemTypeOptions: { value: TemplateItemType; label: string }[] = [
  { value: "checkbox", label: "Checkbox" },
  { value: "rating", label: "Rating" },
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "photo", label: "Photo" },
];

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const { data: template, isLoading } = useTemplate(id || null);
  const updateMutation = useUpdateTemplate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [templateType, setTemplateType] = useState<Template["type"]>("inspection");
  const [standard, setStandard] = useState("Custom");
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");

   
  useEffect(() => {
    if (!template) return;
    setName(template.name);
    setDescription(template.description || "");
    setServiceIds(template.serviceIds ?? (template.serviceId ? [template.serviceId] : []));
    setTemplateType(template.type);
    setStandard(template.standard ?? "Custom");
    setSections(template.sections);
  }, [template]);
   

  const { data: services = [] } = useServices();
  const selectedServiceNames = useMemo(
    () => services.filter((service) => serviceIds.includes(service.serviceId)).map((service) => service.name),
    [services, serviceIds]
  );
  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return services;
    const query = serviceSearch.toLowerCase();
    return services.filter((service) => service.name.toLowerCase().includes(query));
  }, [services, serviceSearch]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Loading template...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Template not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const addSection = () => {
    const id = `sec-${Date.now()}`;
    setSections((prev) => [
      ...prev,
      { id, templateId: template.id, name: "New Section", sortOrder: prev.length + 1, items: [] },
    ]);
  };

  const updateSection = (sectionId: string, patch: Partial<TemplateSection>) => {
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)));
  };

  const deleteSection = (sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
  };

  const moveSection = (sectionId: string, direction: "up" | "down") => {
    setSections((prev) => {
      const index = prev.findIndex((s) => s.id === sectionId);
      if (index === -1) return prev;
      const next = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next.map((section, idx) => ({ ...section, sortOrder: idx + 1 }));
    });
  };

  const addItem = (sectionId: string) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const id = `item-${Date.now()}`;
        return {
          ...section,
          items: [
            ...section.items,
            {
              id,
              sectionId,
              name: "New Item",
              itemType: "checkbox",
              sortOrder: section.items.length + 1,
            },
          ],
        };
      })
    );
  };

  const updateItem = (sectionId: string, itemId: string, patch: Partial<TemplateSection["items"][number]>) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          items: section.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
        };
      })
    );
  };

  const deleteItem = (sectionId: string, itemId: string) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          items: section.items.filter((item) => item.id !== itemId),
        };
      })
    );
  };

  const handleSave = () => {
    const normalizedSections = sections.map((section, sectionIndex) => ({
      ...section,
      sortOrder: sectionIndex + 1,
      items: section.items.map((item, itemIndex) => ({
        ...item,
        sortOrder: itemIndex + 1,
      })),
    }));

    updateMutation.mutate(
      {
        id: template.id,
        data: {
          name,
          description,
          type: templateType,
          standard: standard === "None" ? null : standard,
          serviceIds,
          sections: normalizedSections,
        },
      },
      {
        onSuccess: () => {
          toast.success("Template saved.");
          router.push("/templates");
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "Failed to save template.";
          toast.error(message);
        },
      }
    );
  };

  return (
    <div className="space-y-6">

      <AdminPageHeader
        title={name}
        description="Edit template sections and items"
        actions={
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
          <CardDescription>Basic information for this template</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Linked services</label>
            <div className="flex flex-wrap gap-2">
              {serviceIds.length === 0 ? (
                <span className="text-sm text-muted-foreground">No linked services.</span>
              ) : (
                services
                  .filter((service) => serviceIds.includes(service.serviceId))
                  .map((service) => (
                    <Badge key={service.serviceId} color="light" className="flex items-center gap-1">
                      {service.name}
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setServiceIds((prev) => prev.filter((id) => id !== service.serviceId))}
                        aria-label={`Remove ${service.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
              )}
              <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" className="h-8">
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit services
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Select linked services</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Input
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      placeholder="Search services..."
                    />
                    <div className="max-h-64 overflow-y-auto space-y-2 rounded-sm border p-3">
                      {filteredServices.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No services match your search.</div>
                      ) : (
                        filteredServices.map((service) => {
                          const checked = serviceIds.includes(service.serviceId);
                          return (
                            <label key={service.serviceId} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(value) => {
                                  const isChecked = value === true;
                                  setServiceIds((prev) =>
                                    isChecked
                                      ? [...prev, service.serviceId]
                                      : prev.filter((id) => id !== service.serviceId)
                                  );
                                }}
                              />
                              <span>{service.name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                    <div className="flex justify-end">
                      <Button type="button" onClick={() => setServiceDialogOpen(false)}>
                        Done
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <TagAssignmentEditor scope="template" entityId={template.id} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Template type</label>
              <Select value={templateType} onValueChange={(value) => setTemplateType(value as Template["type"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="agreement">Agreement</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Standard</label>
              <Select value={standard ?? "None"} onValueChange={(value) => setStandard(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select standard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Custom">Custom</SelectItem>
                  <SelectItem value="ASHI">ASHI</SelectItem>
                  <SelectItem value="InterNACHI">InterNACHI</SelectItem>
                  <SelectItem value="NFPA">NFPA</SelectItem>
                  <SelectItem value="None">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge color="light">{templateType}</Badge>
            {standard && standard !== "None" ? <Badge color="light">{standard}</Badge> : null}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Sections</h2>
        <Button variant="outline" onClick={addSection}>
          <Plus className="mr-2 h-4 w-4" />
          Add Section
        </Button>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <Input
                    value={section.name}
                    onChange={(e) => updateSection(section.id, { name: e.target.value })}
                  />
                  <Textarea
                    value={section.description || ""}
                    onChange={(e) => updateSection(section.id, { description: e.target.value })}
                    rows={2}
                    placeholder="Section description"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" size="icon" onClick={() => moveSection(section.id, "up")}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => moveSection(section.id, "down")}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteSection(section.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Items</h3>
                <Button variant="secondary" onClick={() => addItem(section.id)}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-3">
                {section.items.length === 0 ? (
                  <div className="rounded-sm border border-dashed p-4 text-sm text-muted-foreground">
                    No items yet. Add your first checklist item.
                  </div>
                ) : (
                  section.items.map((item) => (
                    <div key={item.id} className="rounded-sm border p-3">
                      <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_0.5fr_auto] items-center">
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem(section.id, item.id, { name: e.target.value })}
                        />
                        <Select
                          value={item.itemType}
                          onValueChange={(value) => updateItem(section.id, item.id, { itemType: value as TemplateItemType })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {itemTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={item.isRequired ?? false}
                            onCheckedChange={(checked) =>
                              updateItem(section.id, item.id, { isRequired: checked === true })
                            }
                          />
                          Required
                        </label>
                        <Button variant="ghost" size="icon" onClick={() => deleteItem(section.id, item.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
