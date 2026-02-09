/**
 * Mock user constants
 * Shared mock user objects for development/testing
 *
 * TODO: Replace all usages of mockAdminUser with real auth context
 * These mock users should ONLY be used in development/testing.
 * Search for: mockAdminUser, mockInspectorUser to find usages
 */

export const mockAdminUser = {
  name: "Sarah Johnson",
  email: "sarah@acmeinspections.com",
  companyName: "Acme Home Inspections",
  role: "OWNER",
};

export const mockInspectorUser = {
  name: "Mike Richardson",
  email: "mike@acmeinspections.com",
  companyName: "Acme Home Inspections",
  role: "INSPECTOR",
};
