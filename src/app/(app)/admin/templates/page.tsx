import { AppShell } from "@/components/layout/app-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FileText, CheckSquare, MoreHorizontal, Copy, Edit, Trash } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { mockAdminUser } from "@/lib/constants/mock-users";

const templates = [
  {
    id: "1",
    name: "Full Home Inspection",
    description: "Complete residential inspection template based on ASHI standards",
    type: "inspection",
    standard: "ASHI",
    sections: 12,
    items: 247,
    isDefault: true,
    usageCount: 892,
    lastModified: "Dec 15, 2025",
  },
  {
    id: "2",
    name: "Pre-Listing Inspection",
    description: "Condensed inspection template for sellers preparing to list",
    type: "inspection",
    standard: "Custom",
    sections: 8,
    items: 156,
    isDefault: false,
    usageCount: 234,
    lastModified: "Nov 20, 2025",
  },
  {
    id: "3",
    name: "Radon Test Report",
    description: "Radon testing documentation and results template",
    type: "inspection",
    standard: "EPA",
    sections: 3,
    items: 24,
    isDefault: false,
    usageCount: 156,
    lastModified: "Oct 5, 2025",
  },
  {
    id: "4",
    name: "Pre-Inspection Agreement",
    description: "Standard pre-inspection agreement for client signature",
    type: "agreement",
    standard: null,
    sections: 1,
    items: null,
    isDefault: true,
    usageCount: 1247,
    lastModified: "Jan 2, 2026",
  },
  {
    id: "5",
    name: "Report Template - Modern",
    description: "Clean, modern report design with photo galleries",
    type: "report",
    standard: null,
    sections: 6,
    items: null,
    isDefault: true,
    usageCount: 654,
    lastModified: "Dec 1, 2025",
  },
];

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
  return (
    <AppShell user={mockAdminUser}>
      <div className="space-y-6">
        <AdminPageHeader
          title="Templates"
          description="Manage inspection checklists, agreements, and report templates"
          actions={
            <Button className="sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
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
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>Set as Default</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
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
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="space-x-4 text-muted-foreground">
                    <span>{template.sections} sections</span>
                    {template.items && <span>{template.items} items</span>}
                  </div>
                  <span className="text-muted-foreground">Used {template.usageCount} times</span>
                </div>

                <div className="mt-4 border-t pt-4">
                  <p className="text-xs text-muted-foreground">Last modified: {template.lastModified}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
