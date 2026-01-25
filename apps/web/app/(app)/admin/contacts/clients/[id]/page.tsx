"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { Edit, Trash2, Mail, Phone, User, DollarSign, ClipboardList, Calendar } from "lucide-react";
import { useClientById, useDeleteClient } from "@/hooks/use-clients";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { RecordInformationCard } from "@/components/shared/record-information-card";
import { ResourceDetailLayout } from "@/components/shared/resource-detail-layout";
import { TagAssignmentEditor } from "@/components/tags/tag-assignment-editor";
import { getContactTypeBadge } from "@/components/contacts/contacts-table-columns";
import { toast } from "sonner";

const formatPropertyAddress = (property: { addressLine1: string; addressLine2?: string | null; city: string; state: string; zipCode: string }) => {
  const parts = [property.addressLine1];
  if (property.addressLine2) {
    parts.push(property.addressLine2);
  }
  parts.push(`${property.city}, ${property.state} ${property.zipCode}`);
  return parts.join(", ");
};

const formatPropertyType = (propertyType: string) => {
  return propertyType.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { id } = params as { id: string };
  const { data: client, isLoading } = useClientById(id);
  const deleteClient = useDeleteClient();

  if (isLoading) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="py-12 text-center text-muted-foreground">Loading client...</div>
      </AdminShell>
    );
  }

  if (!client) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="space-y-6">
          <BackButton href="/admin/contacts" label="Back to Contacts" variant="ghost" />
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold mb-2">Client Not Found</h1>
            <p className="text-muted-foreground">The client you are looking for does not exist.</p>
          </div>
        </div>
      </AdminShell>
    );
  }

  const handleDelete = () => {
    deleteClient.mutate(client.clientId, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        router.push("/admin/contacts");
      },
    });
  };

  const breadcrumb = (
    <>
      <Link href="/admin/overview" className="hover:text-foreground">
        Overview
      </Link>
      <span className="text-muted-foreground">/</span>
      <Link href="/admin/contacts" className="hover:text-foreground">
        Contacts
      </Link>
      <span className="text-muted-foreground">/</span>
      <span>{client.name}</span>
    </>
  );

  const mainContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-muted-foreground" />
                <h2 className="text-2xl font-semibold">{client.name}</h2>
              </div>
              <div className="flex items-center gap-2">{getContactTypeBadge(client.type)}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{client.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{client.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">{client.inspections}</span> inspections
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="font-medium">${client.totalSpent.toLocaleString()}</span> total spent
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Last inspection: {client.lastInspection}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{client.inspections}</div>
            <p className="text-sm text-muted-foreground">Total Inspections</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">${client.totalSpent.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">${client.inspections > 0 ? Math.round(client.totalSpent / client.inspections).toLocaleString() : 0}</div>
            <p className="text-sm text-muted-foreground">Avg per Inspection</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <TagAssignmentEditor scope="client" entityId={client.clientId} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {client.properties && client.properties.length > 0 ? (
            client.properties.map((property) => (
              <Link
                key={property.propertyId}
                href={`/admin/properties/${property.propertyId}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-border/70 px-4 py-3 transition hover:border-primary hover:bg-primary/10"
              >
                <div>
                  <p className="text-sm font-medium">{formatPropertyAddress(property)}</p>
                  <p className="text-xs text-muted-foreground">
                    {property.city}, {property.state} {property.zipCode}
                  </p>
                </div>
                <Badge variant="outline">{formatPropertyType(property.propertyType)}</Badge>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">This client does not yet have any linked properties.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inspection History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground py-8 text-center">Inspection history will be displayed here when integrated with inspections data.</div>
        </CardContent>
      </Card>
    </div>
  );

  const sidebarContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-2">
            <Button variant="outline" asChild className="w-full justify-start">
              <Link href={`/admin/contacts/clients/${client.clientId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
          <Button variant="outline" className="w-full justify-start" onClick={() => toast("Send email is coming soon.")}>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => toast("Call log is coming soon.")}>
            <Phone className="mr-2 h-4 w-4" />
            Log Phone Call
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={() => toast("Schedule inspection is coming soon.")}>
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Inspection
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} className="w-full justify-start">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </CardContent>
      </Card>

      <RecordInformationCard createdAt={client.createdAt} updatedAt={client.updatedAt} />
    </div>
  );

  return (
    <AdminShell user={mockAdminUser}>
      <ResourceDetailLayout
        breadcrumb={breadcrumb}
        title={client.name}
        description={`Client • ${client.type}`}
        backHref="/admin/contacts"
        main={mainContent}
        sidebar={sidebarContent}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete {client.name}? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
