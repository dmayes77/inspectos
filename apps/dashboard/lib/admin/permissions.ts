import { getPermissionsForRole } from "@/lib/permissions";

export function can(role: string | undefined, permission: string, explicitPermissions?: string[] | null): boolean {
  const rolePermissions = role ? getPermissionsForRole(role) : [];
  const explicit = Array.isArray(explicitPermissions) ? explicitPermissions : [];
  if (explicit.length === 0) {
    return rolePermissions.includes(permission);
  }
  return rolePermissions.includes(permission) || explicit.includes(permission);
}
