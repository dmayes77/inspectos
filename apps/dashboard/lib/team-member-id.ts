/**
 * Team Member ID Generation Utility
 *
 * Format: [COMPANY_PREFIX]-[ROLE_PREFIX][NUMBER]
 * Example: ACM-1001 (Owner/Admin), ACM-2001 (Office Staff), ACM-3001 (Inspector)
 *
 * Role Prefixes:
 * - 1xxx: OWNER and ADMIN
 * - 2xxx: OFFICE_STAFF
 * - 3xxx: INSPECTOR
 * - 4xxx+: Future roles
 *
 * Rules:
 * - IDs are assigned once and NEVER reused
 * - Each role type has its own counter that only increments
 * - Deactivated/deleted members keep their ID
 * - Starting number per role: x001 (e.g., 1001, 2001, 3001)
 */

export type TeamMemberRole = 'OWNER' | 'ADMIN' | 'INSPECTOR' | 'OFFICE_STAFF' | string;

export interface TeamMemberIdConfig {
  companyPrefix: string;  // 2-4 uppercase letters (e.g., "ACM")
  role: TeamMemberRole;  // Role determines the leading digit
  lastIssuedNumberForRole: number;  // Last sequence number for this role (e.g., 2 means ACM-3002 was last)
  numberPadding?: number;  // Default 3 digits for sequence
}

/**
 * Get the role prefix digit for a given role
 */
export function getRolePrefix(role: TeamMemberRole): number {
  switch (role) {
    case 'OWNER':
    case 'ADMIN':
      return 1;
    case 'OFFICE_STAFF':
      return 2;
    case 'INSPECTOR':
      return 3;
    default:
      // Future roles start at 4
      return 4;
  }
}

/**
 * Generate the next team member ID for a specific role
 */
export function generateNextTeamMemberId(config: TeamMemberIdConfig): {
  id: string;
  nextNumber: number;
} {
  const rolePrefix = getRolePrefix(config.role);
  const nextSequence = config.lastIssuedNumberForRole + 1;
  const padding = config.numberPadding || 3;
  const paddedSequence = nextSequence.toString().padStart(padding, '0');

  return {
    id: `${config.companyPrefix}-${rolePrefix}${paddedSequence}`,
    nextNumber: nextSequence,
  };
}

/**
 * Validate team member ID format
 */
export function isValidTeamMemberId(id: string): boolean {
  // Format: 2-4 uppercase letters, hyphen, 4 digits (role prefix + sequence)
  const pattern = /^[A-Z]{2,4}-[1-9]\d{3}$/;
  return pattern.test(id);
}

/**
 * Parse team member ID into parts
 */
export function parseTeamMemberId(id: string): {
  companyPrefix: string;
  rolePrefix: number;
  sequenceNumber: number;
  fullNumber: number;
} | null {
  if (!isValidTeamMemberId(id)) {
    return null;
  }

  const [prefix, numberStr] = id.split('-');
  const fullNumber = parseInt(numberStr, 10);
  const rolePrefix = parseInt(numberStr[0], 10);
  const sequenceNumber = parseInt(numberStr.substring(1), 10);

  return {
    companyPrefix: prefix,
    rolePrefix,
    sequenceNumber,
    fullNumber,
  };
}

/**
 * Get role category from team member ID
 */
export function getRoleFromId(id: string): string | null {
  const parsed = parseTeamMemberId(id);
  if (!parsed) return null;

  switch (parsed.rolePrefix) {
    case 1:
      return 'OWNER/ADMIN';
    case 2:
      return 'OFFICE_STAFF';
    case 3:
      return 'INSPECTOR';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Generate company prefix from company name
 * Examples:
 * - "Acme Home Inspections" -> "ACM"
 * - "Johnson Inspection Services" -> "JIS"
 * - "Elite Property Inspectors" -> "EPI"
 */
export function generateCompanyPrefix(companyName: string): string {
  // Remove common words
  const filtered = companyName
    .replace(/\b(Home|Property|Inspection|Inspections|Services|Company|LLC|Inc)\b/gi, '')
    .trim();

  // Get first letter of each word
  const words = filtered.split(/\s+/).filter(w => w.length > 0);

  if (words.length >= 2) {
    // Use first letter of first 2-3 words
    return words
      .slice(0, 3)
      .map(w => w[0].toUpperCase())
      .join('');
  } else if (words.length === 1 && words[0].length >= 3) {
    // Use first 3 letters of single word
    return words[0].substring(0, 3).toUpperCase();
  }

  // Fallback: first 3 letters of company name
  return companyName.substring(0, 3).toUpperCase();
}

/**
 * Format team member ID for display
 * Ensures consistent formatting throughout the app
 */
export function formatTeamMemberId(id: string): string {
  return id.toUpperCase().trim();
}

/**
 * Mock data helper - generates role-based IDs for demo purposes
 */
export function generateMockTeamMemberIds(
  companyPrefix: string,
  role: TeamMemberRole,
  count: number,
  startSequence: number = 1
): string[] {
  const ids: string[] = [];
  const rolePrefix = getRolePrefix(role);

  for (let i = 0; i < count; i++) {
    const sequence = (startSequence + i).toString().padStart(3, '0');
    ids.push(`${companyPrefix}-${rolePrefix}${sequence}`);
  }
  return ids;
}
