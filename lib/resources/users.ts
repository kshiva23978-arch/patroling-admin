import "server-only";

import { apiFetch, apiFetchPaginated, type Paginated } from "@/lib/api-client";
import type { UserCreateInput, UserUpdateInput } from "@/lib/schemas/users";

export interface FieldUser {
  id: string;
  employee_id: string;
  role: string | null;
  designation: string | null;
  status: boolean;
  created_at: string | null;
  updated_at: string | null;
}

function toCreatePayload(input: UserCreateInput) {
  return {
    u_employee_id: input.employeeId,
    u_password_hash: input.password,
    u_role_id: input.roleId || null,
    u_designation_id: input.designationId || null,
    u_status: input.status,
  };
}

function toUpdatePayload(input: UserUpdateInput) {
  const payload: Record<string, unknown> = {
    u_employee_id: input.employeeId,
    u_role_id: input.roleId || null,
    u_designation_id: input.designationId || null,
    u_status: input.status,
  };
  if (input.password) {
    payload.u_password_hash = input.password;
  }
  return payload;
}

export function listUsers(page = 1): Promise<Paginated<FieldUser>> {
  return apiFetchPaginated<FieldUser>(`/admin/users?page=${page}`);
}

export function getUser(id: string): Promise<FieldUser> {
  return apiFetch<FieldUser>(`/admin/users/${id}`);
}

export function createUser(input: UserCreateInput): Promise<FieldUser> {
  return apiFetch<FieldUser>("/admin/users", { method: "POST", body: JSON.stringify(toCreatePayload(input)) });
}

export function updateUser(id: string, input: UserUpdateInput): Promise<FieldUser> {
  return apiFetch<FieldUser>(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(toUpdatePayload(input)) });
}

// Note: the backend intentionally exposes no destroy route for Users
// (they own cascading range access and patrol entries) — no deleteUser here.
