import { getPermissionsForRole } from "@/lib/permissions";

export function can(role: string | undefined, permission: string, explicitPermissions?: string[] | null): boolean {
  if (Array.isArray(explicitPermissions) && explicitPermissions.length > 0) {
    return explicitPermissions.includes(permission);
  }
  if (!role) return false;
  return getPermissionsForRole(role).includes(permission);
}
