"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
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
import { Edit, Trash2, DollarSign, ClipboardList, Calendar, Mail, Phone } from "lucide-react";
import { useClientById, useDeleteClient } from "@/hooks/use-clients";
import { ResourceDetailLayout } from "@/components/shared/resource-detail-layout";
import { TagAssignmentEditor } from "@/components/tags/tag-assignment-editor";

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

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { id } = params as { id: string };
  const { data: client, isLoading } = useClientById(id);
  const deleteClient = useDeleteClient();

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">Loading client...</div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-semibold mb-2">Client Not Found</h1>
          <p className="text-muted-foreground">The client you are looking for does not exist.</p>
        </div>
      </div>
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

  const mainContent = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
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

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Inspections" value={client.inspections} />
        <StatCard label="Total Revenue" value={`$${client.totalSpent.toLocaleString()}`} />
        <StatCard label="Avg per Inspection" value={`$${client.inspections > 0 ? Math.round(client.totalSpent / client.inspections).toLocaleString() : 0}`} />
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
                <Badge color="light">{formatPropertyType(property.propertyType)}</Badge>
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

      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Delete contact</p>
          <p className="text-xs text-muted-foreground">Permanently remove this contact and all associated data.</p>
        </div>
        <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );

  const headerActions = (
    <Button variant="outline" asChild>
      <Link href={`/admin/contacts/${client.clientId}/edit`}>
        <Edit className="mr-2 h-4 w-4" />
        Edit Contact
      </Link>
    </Button>
  );

  return (
    <>
    <ResourceDetailLayout
      title={client.name}
      description={`Client • ${client.type}`}
      main={mainContent}
      headerActions={headerActions}
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
    </>
  );
}
