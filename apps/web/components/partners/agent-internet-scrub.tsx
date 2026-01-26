"use client";

import { KeyboardEvent, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CompanyLogo } from "@/components/shared/company-logo";
import { useAgentScrub } from "@/hooks/use-agent-scrub";
import type { AgentScrubResult } from "@/types/agent-scrub";
import { Mail, Phone, ShieldCheck, Link2, MapPin } from "lucide-react";

const PLACEHOLDER_URL = "https://agents.example.test/profiles/jane-smith";

type AgentInternetScrubProps = {
  onApply: (result: AgentScrubResult) => void;
};

export function AgentInternetScrub({ onApply }: AgentInternetScrubProps) {
  const [profileUrl, setProfileUrl] = useState("");
  const { scrub, result, error, isScrubbing } = useAgentScrub();
  const [lastAppliedUrl, setLastAppliedUrl] = useState<string | null>(null);

  const initials = (value: string | null) =>
    value
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "AG";

  const handleScrub = async () => {
    if (isScrubbing) return;
    const trimmed = profileUrl.trim();
    if (!trimmed) return;
    try {
      await scrub(trimmed);
      setLastAppliedUrl(null);
    } catch (_) {
      // errors handled in hook state
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleScrub();
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApply(result);
    setLastAppliedUrl(result.url);
  };

  const helperText = (() => {
    if (error) return error;
    if (isScrubbing) return "Importing the profile details...";
    if (result) return "Review the extracted info and apply it to the form.";
    return "Paste a public agent profile URL to pull their details automatically.";
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Profile URL Importer</CardTitle>
        <CardDescription>Drop in an agent profile URL and we'll import their details and the brokerage details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={profileUrl}
            onChange={(event) => setProfileUrl(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDER_URL}
            type="url"
            inputMode="url"
            required
            className="flex-1"
          />
          <Button type="button" disabled={isScrubbing} onClick={handleScrub} className="whitespace-nowrap">
            {isScrubbing ? "Importing..." : "Import profile"}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{helperText}</p>

        {result && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={result.photoUrl ?? undefined} alt={result.name ?? "Agent headshot"} />
                <AvatarFallback>{initials(result.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{result.name ?? "Unknown agent"}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Link2 className="h-3 w-3" /> {result.domain}
                  </Badge>
                  {result.agencyName && <Badge variant="secondary">{result.agencyName}</Badge>}
                </div>
                {result.role && <p className="mt-1 text-xs text-muted-foreground">{result.role}</p>}
              </div>
              {(result.logoUrl || result.domain) && (
                <CompanyLogo
                  name={result.agencyName ?? result.domain}
                  logoUrl={result.logoUrl ?? undefined}
                  domain={result.domain}
                  size={40}
                  className="h-10 w-10"
                />
              )}
            </div>

            <div className="grid gap-3 text-sm md:grid-cols-2">
              {result.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{result.email}</span>
                </div>
              )}
              {result.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{result.phone}</span>
                </div>
              )}
              {result.agencyAddress && (
                <div className="flex items-center gap-2 md:col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{result.agencyAddress}</span>
                </div>
              )}
              {result.licenseNumbers.length > 0 && (
                <div className="flex items-center gap-2 md:col-span-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">Licenses: {result.licenseNumbers.join(", ")}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" size="sm" onClick={handleApply} disabled={isScrubbing}>
                {lastAppliedUrl === result.url ? "Applied" : "Apply to form"}
              </Button>
              <span className="text-xs text-muted-foreground">We'll map the headshot, title, contact info, license number, and agency logo into the form.</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
