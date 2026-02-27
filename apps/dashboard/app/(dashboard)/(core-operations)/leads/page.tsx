"use client";

import Link from "next/link";
import { AdminPageHeader } from "@/layout/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, TrendingUp, UserPlus } from "lucide-react";
import { useLeads, type Lead } from "@/hooks/use-leads";

const formatStage = (stage: string) => stage.replace(/_/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());

export default function LeadsPage() {
  const { data: leads = [] as Lead[], isLoading } = useLeads();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Leads"
        description="Track inquiries and convert them into active property work."
        actions={
          <Button asChild>
            <Link href="/leads/new">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Lead
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Lead Pipeline</CardTitle>
          <CardDescription>Separate from clients so pre-conversion work stays clean.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-md border border-dashed p-12 text-center">
              <p className="text-sm text-muted-foreground">Loading leads...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="rounded-md border border-dashed p-12 text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No leads yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">Capture inquiries from your website or add them manually.</p>
              <Button asChild className="mt-6">
                <Link href="/leads/new">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add lead
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map((lead: Lead) => (
                <Link
                  key={lead.leadId}
                  href={`/leads/${lead.leadId}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                      <span className="text-sm font-semibold text-primary">
                        {lead.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{lead.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {lead.email ? (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </span>
                        ) : null}
                        {lead.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color="light">{formatStage(lead.stage)}</Badge>
                    {lead.serviceName ? <Badge color="light">{lead.serviceName}</Badge> : null}
                    {lead.estimatedValue ? <span className="text-sm font-semibold text-muted-foreground">${lead.estimatedValue}</span> : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
