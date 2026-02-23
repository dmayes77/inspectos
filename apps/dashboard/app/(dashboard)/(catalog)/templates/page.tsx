"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FileText, CheckSquare, MoreHorizontal, Copy, Edit, Trash, Star } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/hooks/use-profile";
import { can } from "@/lib/admin/permissions";
import { useTemplates, useDuplicateTemplate, useUpdateTemplate, useCreateTemplateStub } from "@/hooks/use-templates";
import { toast } from "sonner";
import Link from "next/link";

function getTypeBadge(type: string) {
  switch (type) {
    case "inspection":
      return <Badge color="primary" variant="solid">Inspection</Badge>;
    case "agreement":
      return <Badge color="info" variant="solid">Agreement</Badge>;
    case "report":
      return <Badge color="success" variant="solid">Report</Badge>;
    default:
      return <Badge color="light">{type}</Badge>;
  }
}

export default function TemplatesPage() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const userRole = (profile?.role ?? "").toUpperCase();
  const userPermissions = profile?.permissions ?? [];
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
          router.push(`/templates/${newTemplate.id}`);
        },
        onError: () => {
          toast.error("Failed to create template");
        },
      }
    );
  };

  return (
    <>
    <div className="space-y-6">
      <AdminPageHeader
        title="Inspection Templates"
        description="Manage inspection checklists, agreements, and report templates"
        actions={
          can(userRole, "create_templates", userPermissions) ? (
            <Button className="sm:w-auto" onClick={() => setShowNewDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          ) : null
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Inspection Templates" value={templates.filter((t) => t.type === "inspection").length} />
        <StatCard label="Agreement Templates" value={templates.filter((t) => t.type === "agreement").length} />
        <StatCard label="Report Templates" value={templates.filter((t) => t.type === "report").length} />
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
                      <Badge color="light" className="text-xs">
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
                      <Link href={`/templates/${template.id}`}>
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
                {template.standard && <Badge color="light">{template.standard}</Badge>}
                {template.isAddon ? <Badge color="light">Add-on</Badge> : null}
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
    </>
  );
}
