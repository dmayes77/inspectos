export type AgencyLookupResult = {
  id: string;
  name: string;
  domain: string | null;
  logoUrl: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  source: string;
};

export type AgencyLookupResponse = {
  data: AgencyLookupResult[];
  meta?: {
    brandSearchEnabled?: boolean;
  };
};
