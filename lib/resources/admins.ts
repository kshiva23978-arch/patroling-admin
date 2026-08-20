import "server-only";

import { apiFetch, apiFetchPaginated, type Paginated } from "@/lib/api-client";
import type { AdminCreateInput, AdminUpdateInput } from "@/lib/schemas/admins";

export interface Admin {
  id: string;
  employee_id: string;
  role: string | null;
  designation: string | null;
  status: boolean;
  created_at: string | null;
  updated_at: string | null;
}

function toCreatePayload(input: AdminCreateInput) {
  return {
    a_employee_id: input.employeeId,
    a_password_hash: input.password,
    a_role_id: input.roleId || null,
    a_designation_id: input.designationId || null,
    a_status: input.status,
  };
}

function toUpdatePayload(input: AdminUpdateInput) {
  const payload: Record<string, unknown> = {
    a_employee_id: input.employeeId,
    a_role_id: input.roleId || null,
    a_designation_id: input.designationId || null,
    a_status: input.status,
  };
  if (input.password) {
    payload.a_password_hash = input.password;
  }
  return payload;
}

export function listAdmins(page = 1): Promise<Paginated<Admin>> {
  return apiFetchPaginated<Admin>(`/admin/admins?page=${page}`);
}

export function getAdmin(id: string): Promise<Admin> {
  return apiFetch<Admin>(`/admin/admins/${id}`);
}

export function createAdmin(input: AdminCreateInput): Promise<Admin> {
  return apiFetch<Admin>("/admin/admins", { method: "POST", body: JSON.stringify(toCreatePayload(input)) });
}

export function updateAdmin(id: string, input: AdminUpdateInput): Promise<Admin> {
  return apiFetch<Admin>(`/admin/admins/${id}`, { method: "PUT", body: JSON.stringify(toUpdatePayload(input)) });
}

export function deleteAdmin(id: string): Promise<void> {
  return apiFetch<void>(`/admin/admins/${id}`, { method: "DELETE" });
}
