import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { fetchRawUser } from "./api-client";
import { hasAdminPermission, type AdminPermissions } from "./permissions";

export type { AdminPermissions, AdminSectionPermission } from "./permissions";
export { hasAdminPermission } from "./permissions";

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
  /** See backend `Admin::isMasterAdmin` — gates Roles/Designations regardless of `permissions`. */
  is_master_admin: boolean;
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

/**
 * Use at the top of Roles/Designations pages/layouts — these are reserved
 * for a Master Admin (System Administrator) regardless of `permissions`,
 * since granting them to a Department Admin/Ranger role would itself be a
 * privilege-escalation risk (see backend `EnsureMasterAdmin`). Combines
 * [requireAdmin]'s login check, so a page/layout only needs this one call.
 */
export async function requireMasterAdmin(): Promise<AdminIdentity> {
  const admin = await requireAdmin();
  if (!admin.is_master_admin) {
    redirect("/dashboard?denied=master_admin");
  }
  return admin;
}
