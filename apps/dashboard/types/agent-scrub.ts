export type AgentScrubResult = {
  url: string;
  domain: string;
  name: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  licenseNumbers: string[];
  photoUrl: string | null;
  photoCandidates: string[];
  logoUrl: string | null;
  agencyName: string | null;
  agencyAddress: string | null;
};

export type AgentScrubResponse = {
  data: AgentScrubResult;
};
