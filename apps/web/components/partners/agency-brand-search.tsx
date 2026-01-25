"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";
import { CompanyLogo } from "@/components/shared/company-logo";
import { useAgencyLookup } from "@/hooks/use-agency-lookup";
import type { AgencyLookupResult } from "@/types/agency-lookup";

const MIN_QUERY_LENGTH = 2;

type AgencyBrandSearchProps = {
  onApply: (result: AgencyLookupResult) => void;
};

export function AgencyBrandSearch({ onApply }: AgencyBrandSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timeout);
  }, [query]);

  const { results, isSearching, error, brandSearchEnabled } = useAgencyLookup(debouncedQuery);

  const helperText = useMemo(() => {
    if (!query.trim()) return "Search by brokerage name or domain.";
    if (query.trim().length < MIN_QUERY_LENGTH) return "Enter at least 2 characters to search.";
    if (isSearching) return "Scrubbing the internet...";
    if (error) return error;
    if (results.length === 0) return "No matches yet. Try another spelling or full domain.";
    return brandSearchEnabled ? "Select a result to prefill the form below." : "Add LOGO_DEV_SECRET_KEY to enable Logo.dev Brand Search.";
  }, [brandSearchEnabled, error, isSearching, query, results.length]);

  const handleApply = (result: AgencyLookupResult) => {
    onApply(result);
    setQuery("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Internet Scrub</CardTitle>
        <CardDescription>Find a brokerage profile and copy the basics into this form.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Start typing a company or domain..." />
        <p className="text-sm text-muted-foreground">{helperText}</p>

        <div className="space-y-3">
          {results.map((result) => (
            <div key={result.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-start gap-3">
                <CompanyLogo name={result.name} domain={result.domain} website={result.website} size={48} className="h-12 w-12" />
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium">{result.name}</span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {result.source === "logo-dev" ? "Logo.dev" : result.source}
                    </Badge>
                  </div>
                  {result.domain && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" />
                      {result.domain}
                    </div>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleApply(result)}>
                Use details
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
