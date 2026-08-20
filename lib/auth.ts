import "server-only";

import { redirect } from "next/navigation";
import { fetchRawUser } from "./api-client";

export interface AdminIdentity {
  a_id: string;
  a_employee_id: string;
  a_role_id: string | null;
  a_designation_id: string | null;
  a_status: boolean;
  a_last_login: string | null;
  a_created_at: string | null;
  a_updated_at: string | null;
}

export async function getCurrentAdmin(): Promise<AdminIdentity | null> {
  return fetchRawUser<AdminIdentity>();
}

/** Use at the top of protected Server Components; redirects to /login if the session is missing or invalid. */
export async function requireAdmin(): Promise<AdminIdentity> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/login");
  }
  return admin;
}
