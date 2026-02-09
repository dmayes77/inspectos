export const CONTACT_TYPE_OPTIONS = [
  { value: "Homebuyer", label: "Homebuyer" },
  { value: "Real Estate Agent", label: "Real Estate Agent" },
  { value: "Seller", label: "Seller" },
] as const;

export const CONTACT_TYPE_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  ...CONTACT_TYPE_OPTIONS,
] as const;
