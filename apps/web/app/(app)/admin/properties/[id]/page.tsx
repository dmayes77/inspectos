"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ResourceDetailLayout } from "@/components/shared/resource-detail-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { Edit, Trash2, FileText, Loader2 } from "lucide-react";
import { useProperty, useDeleteProperty, formatPropertyAddress } from "@/hooks/use-properties";
import { useClientById } from "@/hooks/use-clients";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { PropertyTypeIcon } from "@/components/properties/property-type-icon";
import { ClientInfoCard } from "@/components/shared/client-info-card";
import { RecordInformationCard } from "@/components/shared/record-information-card";
import { RESIDENTIAL_PROPERTY_TYPES } from "@/lib/constants/property-options";
import { getContactTypeBadge } from "@/components/contacts/contacts-table-columns";
import type { PropertyOwner } from "@/lib/data/properties";

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const { data: property, isLoading, isError } = useProperty(propertyId);
  const deleteProperty = useDeleteProperty();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const ownerHistory = useMemo(() => {
    if (!property) return [];
    const list = [...(property.owners ?? [])].sort((a, b) => {
      const aDate = new Date(a.startDate).getTime();
      const bDate = new Date(b.startDate).getTime();
      return bDate - aDate;
    });
    return list;
  }, [property]);
  const currentOwnerRow = ownerHistory.find((row) => row.isPrimary && row.endDate === null) || ownerHistory.find((row) => row.endDate === null);
  const ownerClient = currentOwnerRow?.client ?? property?.client ?? null;
  const ownerClientId = ownerClient?.id ?? null;
  const { data: ownerDetails } = useClientById(ownerClientId ?? undefined);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProperty.mutateAsync(propertyId);
      router.push("/admin/properties");
    } catch (error) {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="flex items-center justify-center min-h-100">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminShell>
    );
  }

  if (isError || !property) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="space-y-6">
          <PageHeader
            breadcrumb={
              <>
                <Link href="/admin/overview" className="hover:text-foreground">
                  Overview
                </Link>
                <span className="text-muted-foreground">/</span>
                <Link href="/admin/properties" className="hover:text-foreground">
                  Properties
                </Link>
              </>
            }
            title="Property Not Found"
            description="The property you're looking for doesn't exist or you don't have access."
            backHref="/admin/properties"
          />
        </div>
      </AdminShell>
    );
  }

  const residentialTypes = new Set<string>(RESIDENTIAL_PROPERTY_TYPES);
  const displayValue = (value: string | number | boolean | null | undefined, suffix?: string) => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-muted-foreground">—</span>;
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    return suffix ? `${value} ${suffix}` : `${value}`;
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString();
  };

  const isAgentContact = ownerDetails?.type === "Real Estate Agent";
  const contactActionLabel = isAgentContact ? "View Agent Profile" : "View Client Profile";
  const contactActionHref = ownerClient ? `/admin/contacts/${ownerClient.id}` : undefined;
  const typeBadge = ownerDetails?.type ? getContactTypeBadge(ownerDetails.type) : undefined;

  const breadcrumb = (
    <>
      <Link href="/admin/overview" className="hover:text-foreground">
        Overview
      </Link>
      <span className="text-muted-foreground">/</span>
      <Link href="/admin/properties" className="hover:text-foreground">
        Properties
      </Link>
      <span className="text-muted-foreground">/</span>
      <span>{property.address_line1}</span>
    </>
  );

  const headerMeta = (
    <>
      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <PropertyTypeIcon type={property.property_type} />
        <span className="font-medium text-foreground">{property.address_line1}</span>
      </span>
      <Badge variant="outline" className="text-xs px-2 py-0.5 capitalize">
        {property.property_type.replace("-", " ")}
      </Badge>
    </>
  );

  const quickActionsSidebar = (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button asChild variant="outline" className="w-full justify-start">
            <Link href={`/admin/properties/${propertyId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Property
            </Link>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Property
          </Button>
        </CardContent>
      </Card>

      <RecordInformationCard createdAt={property.created_at} updatedAt={property.updated_at} />
    </div>
  );

  const mainContent = (
    <div className="space-y-6">
      <ClientInfoCard
        title="Owner/Contact"
        client={ownerClient ?? undefined}
        actionLabel={contactActionLabel}
        actionHref={contactActionHref}
        typeBadge={typeBadge}
        emptyLabel="No owner/contact assigned"
        emptyActionLabel="Assign Contact"
        emptyActionHref={`/admin/properties/${propertyId}/edit`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Ownership History</CardTitle>
          <CardDescription>Latest owner appears at the top</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ownerHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ownership history recorded.</p>
          ) : (
            ownerHistory.map((owner) => (
              <div key={owner.propertyOwnerId} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {owner.client ? (
                      <Link href={`/admin/contacts/${owner.client.id}`} className="font-medium hover:underline">
                        {owner.client.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-muted-foreground">Unassigned</span>
                    )}
                    {owner.isPrimary && (
                      <Badge variant="outline" className="text-xs">
                        Primary
                      </Badge>
                    )}
                    {owner.endDate === null ? (
                      <Badge variant="secondary" className="text-xs">
                        Current
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Past
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(owner.startDate)} — {owner.endDate ? formatDate(owner.endDate) : "Present"}
                  </p>
                  {owner.client?.email && <p className="text-xs text-muted-foreground">{owner.client.email}</p>}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Street Address</p>
            <p className="font-medium">{property.address_line1}</p>
            {property.address_line2 && <p className="text-sm text-muted-foreground">{property.address_line2}</p>}
          </div>
          <Separator />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">City</p>
              <p className="font-medium">{property.city}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">State</p>
              <p className="font-medium">{property.state}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Zip Code</p>
              <p className="font-medium">{property.zip_code}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Property Type</p>
              <Badge variant="outline" className="capitalize">
                {property.property_type.replace("-", " ")}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Year Built</p>
              <p className="font-medium">{property.year_built || <span className="text-muted-foreground">—</span>}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Square Feet</p>
              <p className="font-medium">
                {property.square_feet ? (
                  `${property.square_feet.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} sqft`
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </p>
            </div>
          </div>
          {(residentialTypes.has(property.property_type) || property.property_type === "multi-family") && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bedrooms</p>
                  <p className="font-medium">{displayValue(property.bedrooms)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bathrooms</p>
                  <p className="font-medium">{displayValue(property.bathrooms)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Stories</p>
                  <p className="font-medium">{displayValue(property.stories)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Foundation</p>
                  <p className="font-medium">{displayValue(property.foundation)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Garage</p>
                  <p className="font-medium">{displayValue(property.garage)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pool</p>
                  <p className="font-medium">{displayValue(property.pool)}</p>
                </div>
              </div>
            </>
          )}
          {residentialTypes.has(property.property_type) && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Basement</p>
                  <p className="font-medium">{displayValue(property.basement?.replace("-", " "))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lot Size</p>
                  <p className="font-medium">{displayValue(property.lot_size_acres, "acres")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Heating</p>
                  <p className="font-medium">{displayValue(property.heating_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Cooling</p>
                  <p className="font-medium">{displayValue(property.cooling_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Roof Type</p>
                  <p className="font-medium">{displayValue(property.roof_type)}</p>
                </div>
              </div>
            </>
          )}
          {property.property_type === "commercial" && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Building Class</p>
                  <p className="font-medium">{displayValue(property.building_class)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Occupancy Type</p>
                  <p className="font-medium">{displayValue(property.occupancy_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Zoning</p>
                  <p className="font-medium">{displayValue(property.zoning)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ceiling Height</p>
                  <p className="font-medium">{displayValue(property.ceiling_height, "ft")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Loading Docks</p>
                  <p className="font-medium">{displayValue(property.loading_docks)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Parking Spaces</p>
                  <p className="font-medium">{displayValue(property.parking_spaces)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Elevator</p>
                  <p className="font-medium">{displayValue(property.elevator)}</p>
                </div>
              </div>
            </>
          )}
          {property.property_type === "multi-family" && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Units</p>
                  <p className="font-medium">{displayValue(property.number_of_units)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Unit Mix</p>
                  <p className="font-medium">{displayValue(property.unit_mix)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Laundry</p>
                  <p className="font-medium">{displayValue(property.laundry_type?.replace("-", " "))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Parking Spaces</p>
                  <p className="font-medium">{displayValue(property.parking_spaces)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Elevator</p>
                  <p className="font-medium">{displayValue(property.elevator)}</p>
                </div>
              </div>
            </>
          )}
          {property.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{property.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orders History</CardTitle>
          <CardDescription>Inspection orders for this property</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Orders feature coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <AdminShell user={mockAdminUser}>
      <ResourceDetailLayout
        breadcrumb={breadcrumb}
        title="Property Details"
        description={formatPropertyAddress(property)}
        meta={headerMeta}
        backHref="/admin/properties"
        main={mainContent}
        sidebar={quickActionsSidebar}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this property? This action cannot be undone.
              {property.client && <span className="block mt-2 text-destructive">Note: This will not delete the associated client.</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Property"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}
