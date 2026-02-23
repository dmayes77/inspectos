"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Mail, Phone, Search, Globe } from "lucide-react";
import { useCreateAgency } from "@/hooks/use-agencies";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CompanyLogo } from "@/components/shared/company-logo";
import { useAgencyLookup } from "@/hooks/use-agency-lookup";
import type { AgencyLookupResult } from "@/types/agency-lookup";

const DEFAULT_TENANT_SLUG = "demo";

export function AgencyLookupCard({ tenantSlug = DEFAULT_TENANT_SLUG }: { tenantSlug?: string }) {
  const router = useRouter();
  const createAgency = useCreateAgency();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => clearTimeout(timeout);
  }, [query]);

  const { results, isSearching, error, brandSearchEnabled } = useAgencyLookup(debouncedQuery);

  const locationCopy = (result: AgencyLookupResult) => [result.city, result.state, result.country].filter(Boolean).join(", ") || null;

  const canSearch = query.trim().length >= 2;

  const handleSave = (result: AgencyLookupResult) => {
    setSavingId(result.id);
    const website = result.website ?? (result.domain ? `https://${result.domain}` : null);
    createAgency.mutate(
      {
        name: result.name,
        status: "active",
        logo_url: result.logoUrl,
        email: result.email,
        phone: result.phone,
        website,
        address_line1: result.addressLine1,
        address_line2: result.addressLine2,
        city: result.city,
        state: result.state,
        zip_code: result.postalCode,
        notes: `Imported via profile URL importer (${result.source})`,
      },
      {
        onSuccess: (agency) => {
          toast.success("Agency saved", {
            description: `${result.name} has been added to your directory`,
            action: {
              label: "Open",
              onClick: () => router.push(`/agents/agencies/${agency.id}`),
            },
          });
          setQuery("");
        },
        onError: (mutationError) => {
          const message = mutationError instanceof Error ? mutationError.message : "Failed to save agency";
          toast.error(message);
        },
        onSettled: () => setSavingId(null),
      },
    );
  };

  const helperText = useMemo(() => {
    if (!canSearch) return "Enter at least 2 characters to search the web.";
    if (isSearching) return "Searching for matching brokerages...";
    if (error) return error;
    if (canSearch && results.length === 0) return "No matches yet. Try a domain or brokerage name.";
    return brandSearchEnabled ? "Powered by Logo.dev Brand Search." : "Add LOGO_DEV_SECRET_KEY to apps/api server env to enable Logo.dev Brand Search results.";
  }, [brandSearchEnabled, canSearch, error, isSearching, results.length]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile URL Importer</CardTitle>
        <CardDescription>Search for a brokerage and one-click import their contact info.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Start typing an agency or domain..." className="pl-9" />
        </div>
        <p className="text-sm text-muted-foreground">{helperText}</p>

        <div className="space-y-3">
          {results.map((result) => {
            const location = locationCopy(result);
            const isSaving = savingId === result.id && createAgency.isPending;
            return (
              <div key={result.id} className="flex flex-col gap-3 rounded-sm border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 items-start gap-3">
                  <CompanyLogo name={result.name} domain={result.domain} website={result.website} size={48} className="h-12 w-12" />
                  <div className="space-y-1 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{result.name}</span>
                      <Badge color="light" className="text-xs capitalize">
                        {result.source === "logo-dev" ? "Logo.dev" : result.source}
                      </Badge>
                    </div>
                    {result.domain && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Globe className="h-3.5 w-3.5" />
                        <span>{result.domain}</span>
                      </div>
                    )}
                    <div className="grid gap-1 text-muted-foreground sm:grid-cols-2">
                      {result.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {result.email}
                        </span>
                      )}
                      {result.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {result.phone}
                        </span>
                      )}
                      {location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled={isSaving} onClick={() => handleSave(result)} className="sm:self-start">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving
                    </>
                  ) : (
                    "Save agency"
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
