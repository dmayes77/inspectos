"use client";

import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CompanyLogo } from "@/components/shared/company-logo";
import { useAgentScrub } from "@/hooks/use-agent-scrub";
import { logoDevUrl } from "@inspectos/shared/utils/logos";
import type { AgentScrubResult } from "@/types/agent-scrub";
import { Mail, Phone, ShieldCheck, Link2, MapPin } from "lucide-react";

const AGENT_PLACEHOLDER_URL = "https://agents.example.test/profiles/jane-smith";
const AGENCY_PLACEHOLDER_URL = "https://www.hopecrestre.com";
const MAPS_BASE_URL = "https://www.google.com/maps/search/?api=1&query=";

type AgentInternetScrubProps = {
  onApply: (result: AgentScrubResult) => void;
  variant?: "agent" | "agency";
  urlRequired?: boolean;
};

export function AgentInternetScrub({ onApply, variant = "agent", urlRequired = true }: AgentInternetScrubProps) {
  const [profileUrl, setProfileUrl] = useState("");
  const { scrub, result, error, isScrubbing } = useAgentScrub();
  const [lastAppliedUrl, setLastAppliedUrl] = useState<string | null>(null);
  const [seenPhotos, setSeenPhotos] = useState<string[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  const isAgencyVariant = variant === "agency";
  const logoDevCandidate = useMemo(() => logoDevUrl(result?.domain ?? result?.url ?? null, { size: 96 }) ?? null, [result?.domain, result?.url]);
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const imageCandidates = useMemo(() => {
    const base = isAgencyVariant
      ? [...(logoDevCandidate ? [logoDevCandidate] : []), ...(result?.logoUrl ? [result.logoUrl] : []), ...(result?.photoCandidates ?? [])]
      : [...(result?.photoCandidates ?? [])];
    return Array.from(new Set(base));
  }, [isAgencyVariant, result?.photoCandidates, result?.logoUrl, logoDevCandidate]);
  const imageCandidatesKey = useMemo(() => imageCandidates.join("|"), [imageCandidates]);
  const activePhotoUrl = imageCandidates[photoIndex] ?? result?.photoUrl ?? result?.logoUrl ?? logoDevCandidate ?? null;
  const activePhotoPosition = activePhotoUrl ? imageCandidates.indexOf(activePhotoUrl) : -1;
  const cleanedAgencyAddress = result?.agencyAddress?.trim() || null;
  const agencyMapHref = cleanedAgencyAddress ? `${MAPS_BASE_URL}${encodeURIComponent(cleanedAgencyAddress)}` : null;

  useEffect(() => {
    if (!result) {
      setSeenPhotos([]);
      setPhotoIndex(0);
      return;
    }
    if (isAgencyVariant) {
      setPhotoIndex(0);
      return;
    }
    if (result.photoUrl) {
      const candidateIndex = imageCandidates.indexOf(result.photoUrl);
      setPhotoIndex(candidateIndex >= 0 ? candidateIndex : 0);
      return;
    }
    setPhotoIndex(0);
  }, [result, imageCandidatesKey, isAgencyVariant]);

  const initials = (value: string | null, fallback: string) =>
    value
      ?.split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || fallback;

  const recordScrubPayload = (payload: AgentScrubResult, resetHistory: boolean) => {
    setLastAppliedUrl(null);
    setSeenPhotos((prev) => {
      const base = resetHistory ? [] : prev;
      const merged = new Set(base);
      if (payload.photoCandidates?.length) {
        for (const candidate of payload.photoCandidates) {
          merged.add(candidate);
        }
      }
      if (payload.photoUrl) {
        merged.add(payload.photoUrl);
      }
      return Array.from(merged);
    });
  };

  const handleScrub = async () => {
    if (isScrubbing) return;
    const trimmed = profileUrl.trim();
    if (!trimmed) return;

    const isRepeatScrub = result && trimmed === result.url;
    const options = isRepeatScrub && seenPhotos.length > 0 ? { excludePhotos: seenPhotos } : undefined;

    try {
      const payload = await scrub(trimmed, options);
      recordScrubPayload(payload, !isRepeatScrub);
    } catch (_) {
      // errors handled in hook state
    }
  };

  const handleCyclePhoto = async () => {
    if (!result || isScrubbing) return;
    const nextIndex = photoIndex + 1;
    if (nextIndex < imageCandidates.length) {
      setPhotoIndex(nextIndex);
      setLastAppliedUrl(null);
      return;
    }

    const sourceUrl = result.url ?? profileUrl.trim();
    if (!sourceUrl) return;
    const options = seenPhotos.length > 0 ? { excludePhotos: seenPhotos } : undefined;

    try {
      const payload = await scrub(sourceUrl, options);
      recordScrubPayload(payload, false);
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
    const agencyLabel = result.agencyName ?? result.domain ?? result.name ?? null;
    const basePayload = isAgencyVariant ? { ...result, agencyName: agencyLabel, name: agencyLabel } : result;
    const payload = isAgencyVariant
      ? activePhotoUrl && activePhotoUrl !== basePayload.logoUrl
        ? { ...basePayload, logoUrl: activePhotoUrl }
        : basePayload
      : activePhotoUrl && activePhotoUrl !== basePayload.photoUrl
        ? { ...basePayload, photoUrl: activePhotoUrl }
        : basePayload;
    onApply(payload);
    setLastAppliedUrl(result.url);
  };

  const helperText = (() => {
    if (error) return error;
    if (isScrubbing) return "Importing the profile details...";
    if (result) return "Review the extracted info and apply it to the form.";
    return isAgencyVariant
      ? "Paste the agency website URL to pull their contact and branding details automatically."
      : "Paste a public agent profile URL to pull their details automatically.";
  })();

  const cardTitle = isAgencyVariant ? "Agency Profile URL Importer" : "Agent Profile URL Importer";
  const cardDescription = isAgencyVariant
    ? "Paste the agency's website and we'll pull their contact and branding details."
    : "Drop in an agent profile URL and we'll import their details and the brokerage details.";
  const applyButtonLabel = isAgencyVariant ? "Apply to agency form" : "Apply to form";
  const cycleButtonLabel = isAgencyVariant ? "Cycle image" : "Cycle headshot";
  const applyHelperText = isAgencyVariant
    ? "We'll map the agency logo, contact info, website, and address into the form."
    : "We'll map the headshot, title, contact info, license number, and agency logo into the form.";
  const displayName = result
    ? isAgencyVariant
      ? (result.agencyName ?? result.domain ?? result.name)
      : (result.name ?? result.agencyName ?? result.domain)
    : null;
  const supportingBadge = isAgencyVariant ? null : result?.agencyName;
  const avatarLabel = displayName ?? result?.domain ?? (isAgencyVariant ? "Agency" : "Agent");
  const avatarFallback = initials(avatarLabel, isAgencyVariant ? "CO" : "AG");
  const placeholderUrl = isAgencyVariant ? AGENCY_PLACEHOLDER_URL : AGENT_PLACEHOLDER_URL;
  const logoLabel =
    (isAgencyVariant ? (displayName ?? result?.domain) : (result?.agencyName ?? result?.domain ?? displayName)) ?? (isAgencyVariant ? "Agency" : "Agent");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={profileUrl}
            onChange={(event) => setProfileUrl(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderUrl}
            type="url"
            inputMode="url"
            required={urlRequired}
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
                <AvatarImage
                  src={activePhotoUrl ?? undefined}
                  alt={displayName ? `${displayName} ${isAgencyVariant ? "image" : "headshot"}` : isAgencyVariant ? "Agency image" : "Agent headshot"}
                />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{displayName ?? (isAgencyVariant ? "Unknown agency" : "Unknown agent")}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Link2 className="h-3 w-3" /> {result.domain}
                  </Badge>
                  {supportingBadge && <Badge variant="secondary">{supportingBadge}</Badge>}
                </div>
                {!isAgencyVariant && result.role && <p className="mt-1 text-xs text-muted-foreground">{result.role}</p>}
              </div>
              {(result.logoUrl || result.domain) && (
                <CompanyLogo name={logoLabel} logoUrl={result.logoUrl ?? undefined} domain={result.domain} size={40} className="h-10 w-10" />
              )}
            </div>

            {imageCandidates.length > 1 && activePhotoPosition >= 0 && (
              <p className="text-xs text-muted-foreground">
                Photo {activePhotoPosition + 1} of {imageCandidates.length}. Use the {cycleButtonLabel} button to preview the next image from this page.
              </p>
            )}

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
              {cleanedAgencyAddress &&
                (agencyMapHref ? (
                  <a
                    href={agencyMapHref}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline md:col-span-2"
                  >
                    <MapPin className="h-4 w-4 text-sky-600" />
                    <span className="leading-snug whitespace-pre-line">{cleanedAgencyAddress}</span>
                  </a>
                ) : (
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground md:col-span-2">
                    <MapPin className="h-4 w-4 text-sky-600" />
                    <span className="leading-snug whitespace-pre-line">{cleanedAgencyAddress}</span>
                  </div>
                ))}
              {!isAgencyVariant && result.licenseNumbers.length > 0 && (
                <div className="flex items-center gap-2 md:col-span-2">
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">Licenses: {result.licenseNumbers.join(", ")}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" size="sm" onClick={handleApply} disabled={isScrubbing}>
                {lastAppliedUrl === result.url ? "Applied" : applyButtonLabel}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleCyclePhoto} disabled={isScrubbing || !result}>
                {cycleButtonLabel}
              </Button>
              <span className="text-xs text-muted-foreground">{applyHelperText}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
