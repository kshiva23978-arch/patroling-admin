import "server-only";

import { apiFetch, apiFetchAll, apiFetchPaginated, type Paginated } from "@/lib/api-client";
import {
  ADMIN_SECTIONS,
  APP_FEATURES,
  roleDefaults,
  type AdminSection,
  type AppFeature,
  type RoleInput,
} from "@/lib/schemas/roles";

export interface RolePermissions {
  admin?: Partial<Record<AdminSection, { view?: boolean; manage?: boolean }>>;
  app?: Partial<Record<AppFeature, boolean>>;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  status: boolean;
  /** `null` means unrestricted — see backend `Roles::hasAdminPermission`. */
  permissions: RolePermissions | null;
}

function toPayload(input: RoleInput) {
  return {
    ro_name: input.name,
    ro_description: input.description || null,
    ro_status: input.status,
    ro_permissions: input.restricted
      ? { admin: input.adminPermissions, app: input.appPermissions }
      : null,
  };
}

/**
 * Converts a role's server-side `permissions` (partial, possibly `null`)
 * into the form's always-fully-populated shape — every section/feature
 * defaults to granted so a role that only restricts *some* sections still
 * shows the rest correctly checked, and toggling "restricted" off/on in the
 * form never loses data for the sections it doesn't mention.
 */
export function roleToFormValues(role: Role): RoleInput {
  const restricted = role.permissions !== null;
  const admin = role.permissions?.admin;
  const app = role.permissions?.app;

  return {
    name: role.name,
    description: role.description ?? "",
    status: role.status,
    restricted,
    adminPermissions: Object.fromEntries(
      ADMIN_SECTIONS.map((s) => [
        s,
        { view: admin?.[s]?.view ?? true, manage: admin?.[s]?.manage ?? true },
      ]),
    ) as RoleInput["adminPermissions"],
    appPermissions: Object.fromEntries(
      APP_FEATURES.map((f) => [f, app?.[f] ?? true]),
    ) as RoleInput["appPermissions"],
  };
}

export { roleDefaults };

export function listRoles(page = 1): Promise<Paginated<Role>> {
  return apiFetchPaginated<Role>(`/admin/roles?page=${page}`);
}

export function listAllRoles(): Promise<Role[]> {
  return apiFetchAll<Role>("/admin/roles");
}

export function getRole(id: string): Promise<Role> {
  return apiFetch<Role>(`/admin/roles/${id}`);
}

export function createRole(input: RoleInput): Promise<Role> {
  return apiFetch<Role>("/admin/roles", { method: "POST", body: JSON.stringify(toPayload(input)) });
}

export function updateRole(id: string, input: RoleInput): Promise<Role> {
  return apiFetch<Role>(`/admin/roles/${id}`, { method: "PUT", body: JSON.stringify(toPayload(input)) });
}

export function deleteRole(id: string): Promise<void> {
  return apiFetch<void>(`/admin/roles/${id}`, { method: "DELETE" });
}
