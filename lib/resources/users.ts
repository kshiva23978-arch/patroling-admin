import "server-only";

import { createHash } from "node:crypto";
import { apiFetch, apiFetchPaginated, type Paginated } from "@/lib/api-client";
import type { UserCreateInput, UserUpdateInput } from "@/lib/schemas/users";

/**
 * The backend always stores `bcrypt(sha256(password))` for a ranger — see
 * `UserController::store`/`update`, which treats `u_password_hash` as
 * already being that SHA-256 hex digest, not the raw password. The Flutter
 * app's own login/password flows do this hashing on-device (see its
 * `hashPassword` helper) before ever sending a password anywhere; this
 * mirrors that exactly so a password set from the admin panel logs in
 * correctly from the app — sending the raw password here instead would
 * store `bcrypt(password)`, which the app's `password_hash: sha256(password)`
 * login payload would never match.
 */
function hashPassword(password: string): string {
  return createHash("sha256").update(password, "utf8").digest("hex");
}

export interface FieldUser {
  id: string;
  employee_id: string | null;
  role: string | null;
  designation: string | null;
  has_login: boolean;
  status: boolean;
  created_at: string | null;
  updated_at: string | null;
}

function toCreatePayload(input: UserCreateInput) {
  return {
    u_has_login: input.hasLogin,
    u_employee_id: input.hasLogin ? input.employeeId : null,
    u_password_hash: input.hasLogin ? hashPassword(input.password) : null,
    u_role_id: input.roleId || null,
    u_designation_id: input.designationId || null,
    u_status: input.status,
    range_id: input.rangeId || undefined,
  };
}

function toUpdatePayload(input: UserUpdateInput) {
  const payload: Record<string, unknown> = {
    u_has_login: input.hasLogin,
    u_employee_id: input.hasLogin ? input.employeeId : null,
    u_role_id: input.roleId || null,
    u_designation_id: input.designationId || null,
    u_status: input.status,
  };
  if (input.hasLogin && input.password) {
    payload.u_password_hash = hashPassword(input.password);
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
