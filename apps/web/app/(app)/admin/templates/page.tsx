"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FileText, CheckSquare, MoreHorizontal, Copy, Edit, Trash, Star } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mockAdminUser } from "@inspectos/shared/constants/mock-users";
import { can } from "@/lib/admin/permissions";
import { useTemplates, useDuplicateTemplate, useUpdateTemplate, useCreateTemplateStub } from "@/hooks/use-templates";
import { toast } from "sonner";
import Link from "next/link";

function getTypeBadge(type: string) {
  switch (type) {
    case "inspection":
      return <Badge className="bg-primary">Inspection</Badge>;
    case "agreement":
      return <Badge className="bg-blue-500">Agreement</Badge>;
    case "report":
      return <Badge className="bg-green-500">Report</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

export default function TemplatesPage() {
  const router = useRouter();
  const userRole = mockAdminUser.role;
  const { data: templates = [] } = useTemplates();
  const duplicateMutation = useDuplicateTemplate();
  const updateMutation = useUpdateTemplate();
  const createStubMutation = useCreateTemplateStub();

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");

  const handleDuplicate = (templateId: string, templateName: string) => {
    duplicateMutation.mutate(templateId, {
      onSuccess: (newTemplate) => {
        toast.success(`Duplicated "${templateName}"`);
      },
      onError: () => {
        toast.error("Failed to duplicate template");
      },
    });
  };

  const handleSetDefault = (templateId: string, templateName: string) => {
    updateMutation.mutate(
      { id: templateId, data: { isDefault: true } },
      {
        onSuccess: () => {
          toast.success(`"${templateName}" set as default`);
        },
        onError: () => {
          toast.error("Failed to set as default");
        },
      }
    );
  };

  const handleArchive = (templateId: string, templateName: string) => {
    updateMutation.mutate(
      { id: templateId, data: { isActive: false } },
      {
        onSuccess: () => {
          toast.success(`"${templateName}" archived`);
        },
        onError: () => {
          toast.error("Failed to archive template");
        },
      }
    );
  };

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error("Template name is required");
      return;
    }

    createStubMutation.mutate(
      { name: newTemplateName, description: newTemplateDescription },
      {
        onSuccess: (newTemplate) => {
          toast.success("Template created");
          setShowNewDialog(false);
          setNewTemplateName("");
          setNewTemplateDescription("");
          router.push(`/admin/templates/${newTemplate.id}`);
        },
        onError: () => {
          toast.error("Failed to create template");
        },
      }
    );
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Inspection Templates"
          description="Manage inspection checklists, agreements, and report templates"
          actions={
            can(userRole, "create_templates") ? (
              <Button className="sm:w-auto" onClick={() => setShowNewDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            ) : null
          }
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <CheckSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{templates.filter((t) => t.type === "inspection").length}</div>
                  <p className="text-sm text-muted-foreground">Inspection Templates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{templates.filter((t) => t.type === "agreement").length}</div>
                  <p className="text-sm text-muted-foreground">Agreement Templates</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <FileText className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{templates.filter((t) => t.type === "report").length}</div>
                  <p className="text-sm text-muted-foreground">Report Templates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Templates Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.isDefault && (
                        <Badge variant="outline" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/templates/${template.id}`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(template.id, template.name)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      {!template.isDefault && (
                        <DropdownMenuItem onClick={() => handleSetDefault(template.id, template.name)}>
                          <Star className="mr-2 h-4 w-4" />
                          Set as Default
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleArchive(template.id, template.name)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  {getTypeBadge(template.type)}
                  {template.standard && <Badge variant="outline">{template.standard}</Badge>}
                  {template.isAddon ? <Badge variant="outline">Add-on</Badge> : null}
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="space-x-4 text-muted-foreground">
                    <span>{template.sections.length} sections</span>
                    <span>
                      {template.sections.reduce((sum, section) => sum + section.items.length, 0)} items
                    </span>
                  </div>
                  <span className="text-muted-foreground">Used {template.usageCount ?? 0} times</span>
                </div>

                <div className="mt-4 border-t pt-4">
                  <p className="text-xs text-muted-foreground">Last modified: {template.lastModified ?? "—"}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {templates.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No templates yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create your first inspection template to get started.
              </p>
              <Button className="mt-4" onClick={() => setShowNewDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* New Template Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a new inspection template. You can add sections and items after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                placeholder="e.g., Standard Home Inspection"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="Brief description of this template"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} disabled={createStubMutation.isPending}>
              {createStubMutation.isPending ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
