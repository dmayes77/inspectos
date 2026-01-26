"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { ResourceDetailLayout } from "@/components/shared/resource-detail-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
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
import { RecordInformationCard } from "@/components/shared/record-information-card";
import { mockAdminUser } from "@/lib/constants/mock-users";
import { useAgencyById, useDeleteAgency } from "@/hooks/use-agencies";
import { Building2, Users, Mail, Phone, Globe, MapPin, DollarSign, ClipboardList, Edit, Trash2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { CompanyLogo } from "@/components/shared/company-logo";

type Params = { id: string };

export default function AgencyDetailPage() {
  const params = useParams();
  const { id: agencyId } = params as Params;
  const router = useRouter();
  const { data: agency, isLoading } = useAgencyById(agencyId);
  const deleteAgency = useDeleteAgency();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <AdminShell user={mockAdminUser}>
        <div className="py-12 text-center text-muted-foreground">Loading agency...</div>
      </AdminShell>
    );
  }

  if (!agency) {
    return (
      <AdminShell user={mockAdminUser}>
        <ResourceDetailLayout
          breadcrumb={
            <>
              <Link href="/admin/overview" className="hover:text-foreground">
                Overview
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/admin/partners" className="hover:text-foreground">
                Partners
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href="/admin/partners?tab=agencies" className="hover:text-foreground">
                Agencies
              </Link>
            </>
          }
          title="Agency Not Found"
          description="The agency you're looking for doesn't exist or you're missing access."
          backHref="/admin/partners?tab=agencies"
          main={
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">Try selecting another agency from the list.</CardContent>
            </Card>
          }
          sidebar={<RecordInformationCard createdAt={null} updatedAt={null} />}
        />
      </AdminShell>
    );
  }

  const stats: Array<{ label: string; value: string | number; icon: LucideIcon }> = [
    { label: "Total referrals", value: agency.total_referrals, icon: ClipboardList },
    { label: "Total revenue", value: `$${agency.total_revenue.toLocaleString()}`, icon: DollarSign },
    { label: "Agents", value: agency.agents?.length ?? agency._count?.agents ?? 0, icon: Users },
  ];

  const websiteDisplay = agency.website?.replace(/^https?:\/\//, "").replace(/\/$/, "") ?? null;
  const locationDisplay = [agency.city, agency.state].filter(Boolean).join(", ");

  const breadcrumb = (
    <>
      <Link href="/admin/overview" className="hover:text-foreground">
        Overview
      </Link>
      <span className="text-muted-foreground">/</span>
      <Link href="/admin/partners" className="hover:text-foreground">
        Partners
      </Link>
      <span className="text-muted-foreground">/</span>
      <Link href="/admin/partners?tab=agencies" className="hover:text-foreground">
        Agencies
      </Link>
      <span className="text-muted-foreground">/</span>
      <span>{agency.name}</span>
    </>
  );

  const handleDelete = () => {
    deleteAgency.mutate(agency.id, {
      onSuccess: () => {
        toast.success("Agency deleted");
        router.push("/admin/partners?tab=agencies");
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : "Failed to delete agency";
        toast.error(message);
      },
    });
  };

  const contactItems: Array<{ label: string; value: string | null; icon: LucideIcon }> = [
    { label: "Email", value: agency.email, icon: Mail },
    { label: "Phone", value: agency.phone, icon: Phone },
    { label: "Website", value: agency.website, icon: Globe },
  ];

  const address = [agency.address_line1, agency.address_line2, [agency.city, agency.state].filter(Boolean).join(", "), agency.zip_code]
    .filter((line) => line && line.trim().length > 0)
    .join("\n");

  const agentList = agency.agents ?? [];

  return (
    <AdminShell user={mockAdminUser}>
      <div className="space-y-6">
        <BackButton href="/admin/partners?tab=agencies" label="Back to Agencies" variant="ghost" />

        <AdminPageHeader
          title={
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
              <CompanyLogo
                name={agency.name}
                logoUrl={agency.logo_url}
                website={agency.website}
                domain={agency.website}
                size={96}
                className="h-24 w-24 rounded-2xl"
              />
              <div className="flex-1">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{agency.name}</h1>
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <Badge variant={agency.status === "active" ? "default" : "secondary"} className="capitalize">
                      {agency.status}
                    </Badge>
                    {websiteDisplay && <Badge variant="outline">{websiteDisplay}</Badge>}
                    {locationDisplay && (
                      <Badge variant="secondary" className="text-xs">
                        {locationDisplay}
                      </Badge>
                    )}
                  </div>
                </div>
                {agency.license_number && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium">License:</span> {agency.license_number}
                  </div>
                )}
                {agency.website && (
                  <div className="mt-1 text-sm text-muted-foreground break-all">
                    <Link href={agency.website} target="_blank" className="hover:underline">
                      {agency.website}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          }
          description="Brokerage partner"
          actions={
            <div className="flex flex-col gap-2 sm:flex-row">
              {agency.website && (
                <Button variant="outline" className="w-full sm:w-auto" asChild>
                  <Link href={agency.website} target="_blank">
                    <Globe className="mr-2 h-4 w-4" /> Visit site
                  </Link>
                </Button>
              )}
              <Button className="w-full sm:w-auto" asChild>
                <Link href={`/admin/partners/agencies/${agency.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full text-destructive hover:bg-destructive/5 hover:text-destructive sm:w-auto"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" /> Overview
                </CardTitle>
                <CardDescription>High-level metrics for this agency.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <stat.icon className="h-4 w-4" />
                      {stat.label}
                    </div>
                    <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contactItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-sm">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.value ? <span>{item.value}</span> : <span className="text-muted-foreground">—</span>}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Office Address</CardTitle>
              </CardHeader>
              <CardContent>
                {address ? (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                    <pre className="whitespace-pre-wrap font-sans">{address}</pre>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No address on file.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {agency.notes ? <p className="text-sm leading-6">{agency.notes}</p> : <p className="text-sm text-muted-foreground">No notes captured yet.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agents</CardTitle>
                <CardDescription>Linked agents from this brokerage.</CardDescription>
              </CardHeader>
              <CardContent>
                {agentList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No agents linked yet.</p>
                ) : (
                  <div className="space-y-3">
                    {agentList.map((agent) => (
                      <div key={agent.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                        <div>
                          <Link href={`/admin/partners/agents/${agent.id}`} className="font-medium hover:underline">
                            {agent.name}
                          </Link>
                          <p className="text-muted-foreground">{agent.email ?? "No email"}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground">Referrals</p>
                          <p className="font-semibold">{agent.total_referrals}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <RecordInformationCard createdAt={agency.created_at} updatedAt={agency.updated_at} />
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete agency?</AlertDialogTitle>
            <AlertDialogDescription>This action removes {agency.name} and any agent links. It cannot be undone.</AlertDialogDescription>
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
