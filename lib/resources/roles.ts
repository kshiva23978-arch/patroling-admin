import "server-only";

import { apiFetch, apiFetchAll, apiFetchPaginated, type Paginated } from "@/lib/api-client";
import type { RoleInput } from "@/lib/schemas/roles";

export interface Role {
  id: string;
  name: string;
  description: string | null;
  status: boolean;
}

function toPayload(input: RoleInput) {
  return {
    ro_name: input.name,
    ro_description: input.description || null,
    ro_status: input.status,
  };
}

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
