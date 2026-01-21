import { getPermissionsForRole } from "@/lib/permissions";

export function can(role: string | undefined, permission: string): boolean {
  if (!role) return false;
  return getPermissionsForRole(role).includes(permission);
}
