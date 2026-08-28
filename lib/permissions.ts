/**
 * Pure permission-checking logic, deliberately free of the `"server-only"`
 * import chain (`lib/auth.ts` -> `lib/api-client.ts` -> `lib/session.ts`) —
 * `components/layout/Sidebar.tsx` is a Client Component and needs this same
 * check to decide what to render, and importing anything from `lib/auth.ts`
 * there would drag `"server-only"` into the client bundle and fail the
 * build. `lib/auth.ts` re-exports these for server-side callers so there's
 * still one definition, not two.
 */

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

/**
 * `true` if [admin] is allowed [level] access to [section] — `permissions
 * === null` means unrestricted (no role, or a role with no permissions
 * configured), matching the backend's default-to-full-access rule so a
 * fresh install (or any account nobody has bothered restricting yet) never
 * looks locked out.
 */
export function hasAdminPermission(
  admin: { permissions: AdminPermissions },
  section: string,
  level: "view" | "manage" = "view",
): boolean {
  if (admin.permissions === null) return true;
  return Boolean(admin.permissions[section]?.[level]);
}
