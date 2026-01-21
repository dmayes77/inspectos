// Permission categories and definitions
export const permissionCategories = {
  inspections: {
    label: "Inspections",
    permissions: [
      { id: "view_all_inspections", label: "View all inspections", description: "See all inspections across the organization" },
      { id: "view_own_inspections", label: "View own inspections", description: "See only assigned inspections" },
      { id: "create_inspections", label: "Create inspections", description: "Schedule new inspections" },
      { id: "edit_inspections", label: "Edit inspections", description: "Modify inspection details" },
      { id: "delete_inspections", label: "Delete inspections", description: "Remove inspections from system" },
      { id: "perform_inspections", label: "Perform inspections", description: "Complete field inspections" },
      { id: "assign_inspections", label: "Assign inspections", description: "Assign inspections to inspectors" },
    ],
  },
  reports: {
    label: "Reports & Documents",
    permissions: [
      { id: "view_reports", label: "View reports", description: "Access inspection reports" },
      { id: "generate_reports", label: "Generate reports", description: "Create inspection reports" },
      { id: "edit_reports", label: "Edit reports", description: "Modify generated reports" },
      { id: "deliver_reports", label: "Deliver reports", description: "Send reports to clients" },
    ],
  },
  clients: {
    label: "Client Management",
    permissions: [
      { id: "view_clients", label: "View clients", description: "Access client information" },
      { id: "create_clients", label: "Create clients", description: "Add new clients" },
      { id: "edit_clients", label: "Edit clients", description: "Modify client details" },
      { id: "delete_clients", label: "Delete clients", description: "Remove clients from system" },
      { id: "view_client_history", label: "View client history", description: "See full client inspection history" },
    ],
  },
  team: {
    label: "Team Management",
    permissions: [
      { id: "view_team", label: "View team members", description: "See team member list" },
      { id: "create_team", label: "Add team members", description: "Invite new team members" },
      { id: "edit_team", label: "Edit team members", description: "Modify team member details" },
      { id: "delete_team", label: "Delete team members", description: "Remove team members" },
      { id: "manage_roles", label: "Manage roles & permissions", description: "Change team member roles and permissions" },
    ],
  },
  templates: {
    label: "Templates",
    permissions: [
      { id: "view_templates", label: "View templates", description: "Access inspection templates" },
      { id: "create_templates", label: "Create templates", description: "Design new templates" },
      { id: "edit_templates", label: "Edit templates", description: "Modify existing templates" },
      { id: "delete_templates", label: "Delete templates", description: "Remove templates" },
    ],
  },
  billing: {
    label: "Billing & Finance",
    permissions: [
      { id: "view_billing", label: "View billing", description: "See billing information" },
      { id: "manage_billing", label: "Manage billing", description: "Update payment methods and subscriptions" },
      { id: "view_invoices", label: "View invoices", description: "Access invoices and payments" },
      { id: "create_invoices", label: "Create invoices", description: "Generate client invoices" },
    ],
  },
  settings: {
    label: "Settings",
    permissions: [
      { id: "view_settings", label: "View settings", description: "Access company settings" },
      { id: "edit_settings", label: "Edit settings", description: "Modify company settings" },
      { id: "edit_branding", label: "Edit branding", description: "Update logos and colors" },
      { id: "delete_company", label: "Delete company", description: "Permanently delete organization" },
    ],
  },
};

// Default permissions per role
export const rolePermissions: Record<string, string[]> = {
  OWNER: [
    // All permissions
    "view_all_inspections", "view_own_inspections", "create_inspections", "edit_inspections", "delete_inspections", "perform_inspections", "assign_inspections",
    "view_reports", "generate_reports", "edit_reports", "deliver_reports",
    "view_clients", "create_clients", "edit_clients", "delete_clients", "view_client_history",
    "view_team", "create_team", "edit_team", "delete_team", "manage_roles",
    "view_templates", "create_templates", "edit_templates", "delete_templates",
    "view_billing", "manage_billing", "view_invoices", "create_invoices",
    "view_settings", "edit_settings", "edit_branding", "delete_company",
  ],
  ADMIN: [
    // All except billing management and company deletion
    "view_all_inspections", "view_own_inspections", "create_inspections", "edit_inspections", "delete_inspections", "perform_inspections", "assign_inspections",
    "view_reports", "generate_reports", "edit_reports", "deliver_reports",
    "view_clients", "create_clients", "edit_clients", "delete_clients", "view_client_history",
    "view_team", "create_team", "edit_team", "delete_team", "manage_roles",
    "view_templates", "create_templates", "edit_templates", "delete_templates",
    "view_billing", "view_invoices", "create_invoices",
    "view_settings", "edit_settings", "edit_branding",
  ],
  INSPECTOR: [
    // Field operations only
    "view_own_inspections", "perform_inspections",
    "view_reports", "generate_reports",
    "view_clients", "view_client_history",
    "view_team",
    "view_templates",
  ],
  OFFICE_STAFF: [
    // Office operations, no field work
    "view_all_inspections", "create_inspections", "edit_inspections", "assign_inspections",
    "view_reports", "deliver_reports",
    "view_clients", "create_clients", "edit_clients", "view_client_history",
    "view_team",
    "view_templates",
    "view_invoices", "create_invoices",
  ],
};

export function getAllPermissions(): string[] {
  return Object.values(permissionCategories).flatMap((category) =>
    category.permissions.map((p) => p.id)
  );
}

export function getPermissionsForRole(role: string): string[] {
  return rolePermissions[role] || [];
}
