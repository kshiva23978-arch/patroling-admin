import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { fetchRawUser } from "./api-client";

/** One admin-panel section's permissions — see backend `Roles::ADMIN_SECTIONS`. */
export interface AdminSectionPermission {
  view?: boolean;
  manage?: boolean;
}

/**
 * Keyed by section (e.g. `"beats"`, `"roles"`) — `null` (the whole map, not
 * a missing key) means this admin's role is unrestricted, same as a role
 * with no permissions configured at all. See backend `Roles::hasAdminPermission`.
 */
export type AdminPermissions = Record<string, AdminSectionPermission> | null;

export interface AdminIdentity {
  a_id: string;
  a_employee_id: string;
  a_role_id: string | null;
  a_designation_id: string | null;
  a_status: boolean;
  a_last_login: string | null;
  a_created_at: string | null;
  a_updated_at: string | null;
  permissions: AdminPermissions;
}

/**
 * Wrapped in React's `cache()` so multiple calls within the same request
 * (the root dashboard layout, a per-section layout, a page that also needs
 * the current admin for its own display logic) only hit the backend once —
 * `fetchRawUser` itself opts out of Next's fetch cache (`cache: "no-store"`,
 * since a session can go stale), so without this every nested layout's own
 * `requireAdmin()`/`requirePermission()` call would be a separate round trip.
 */
export const getCurrentAdmin = cache(async (): Promise<AdminIdentity | null> => {
  return fetchRawUser<AdminIdentity>();
});

/** Use at the top of protected Server Components; redirects to /login if the session is missing or invalid. */
export async function requireAdmin(): Promise<AdminIdentity> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/login");
  }
  return admin;
}

/**
 * `true` if [admin] is allowed [level] access to [section] — `permissions
 * === null` means unrestricted (no role, or a role with no permissions
 * configured), matching the backend's default-to-full-access rule so a
 * fresh install (or any account nobody has bothered restricting yet) never
 * looks locked out.
 */
export function hasAdminPermission(
  admin: Pick<AdminIdentity, "permissions">,
  section: string,
  level: "view" | "manage" = "view",
): boolean {
  if (admin.permissions === null) return true;
  return Boolean(admin.permissions[section]?.[level]);
}

/**
 * Use at the top of a section's (or a manage-only sub-route's) layout —
 * redirects to /dashboard if the signed-in admin can't [level] [section].
 * Combines [requireAdmin]'s login check with the permission check, so a
 * page/layout only needs this one call.
 */
export async function requirePermission(
  section: string,
  level: "view" | "manage" = "view",
): Promise<AdminIdentity> {
  const admin = await requireAdmin();
  if (!hasAdminPermission(admin, section, level)) {
    redirect("/dashboard?denied=" + encodeURIComponent(section));
  }
  return admin;
}
