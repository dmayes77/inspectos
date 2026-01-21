"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { ChevronLeft, Edit, Trash2, Mail, Phone, User, DollarSign, ClipboardList, Calendar } from "lucide-react";
import { useClientById, useDeleteClient } from "@/hooks/use-clients";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { TagAssignmentEditor } from "@/components/tags/tag-assignment-editor";

function getTypeBadge(type: string) {
  switch (type) {
    case "Homebuyer":
      return <Badge variant="secondary">Homebuyer</Badge>;
    case "Real Estate Agent":
      return <Badge className="bg-blue-500 hover:bg-blue-500">Agent</Badge>;
    case "Seller":
      return <Badge variant="outline">Seller</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

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
          <Button variant="ghost" asChild>
            <Link href="/admin/clients">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Link>
          </Button>
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
        router.push("/admin/clients");
      },
    });
  };

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6 max-w-4xl">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link href="/admin/clients">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Link>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/admin/clients/${client.clientId}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Client Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <User className="h-6 w-6 text-muted-foreground" />
                  <h1 className="text-2xl font-semibold">{client.name}</h1>
                </div>
                <div className="flex items-center gap-2">
                  {getTypeBadge(client.type)}
                </div>
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

        {/* Stats Cards */}
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
              <div className="text-2xl font-bold">
                ${client.inspections > 0 ? Math.round(client.totalSpent / client.inspections).toLocaleString() : 0}
              </div>
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

        {/* Inspection History Section - Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Inspection History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground py-8 text-center">
              Inspection history will be displayed here when integrated with inspections data.
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Client</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {client.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminShell>
  );
}
