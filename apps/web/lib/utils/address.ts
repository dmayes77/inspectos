/**
 * Address parsing and formatting utilities
 * Centralized logic for parsing address strings into components
 */

export interface AddressParts {
  street: string;
  city: string;
  state: string;
  zip: string;
}

/**
 * Parse a full address string into its components
 * Expected format: "123 Main St, City State ZIP"
 * 
 * @param address - Full address string
 * @returns Parsed address parts
 */
export function parseAddress(address: string): AddressParts {
  if (!address) {
    return { street: "", city: "", state: "", zip: "" };
  }

  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  const street = parts[0] || "";

  if (parts.length < 2) {
    return { street, city: "", state: "", zip: "" };
  }

  const city = parts[1] || "";
  const rest = parts.length > 2 ? parts.slice(2).join(" ") : "";
  const cityStateZip = rest || parts[1] || "";
  const tokens = cityStateZip.split(" ").filter(Boolean);

  const zip = tokens.pop() || "";
  const state = tokens.pop() || "";
  const cityFromRest = tokens.join(" ");

  return {
    street,
    city: cityFromRest || city,
    state,
    zip,
  };
}

/**
 * Format address parts into a full address string
 * 
 * @param parts - Address parts
 * @returns Formatted address string
 */
export function formatAddress(parts: Partial<AddressParts>): string {
  const { street = "", city = "", state = "", zip = "" } = parts;

  const location = [state, zip].filter(Boolean).join(" ");
  const components = [street, city, location].filter(Boolean);
  return components.join(", ");
}

/**
 * Format address parts into a short format (city, state)
 * 
 * @param parts - Address parts
 * @returns Short formatted address
 */
export function formatAddressShort(parts: Partial<AddressParts>): string {
  const { city = "", state = "" } = parts;
  return [city, state].filter(Boolean).join(", ");
}
