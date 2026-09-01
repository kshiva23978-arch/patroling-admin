import "server-only";

import { apiFetchPaginated, type Paginated } from "@/lib/api-client";

export interface LoginLog {
  id: string;
  account_type: "admin" | "user";
  account_id: string | null;
  employee_id: string;
  successful: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
}

export interface LoginLogFilters {
  page?: number;
  type?: "admin" | "user";
  successful?: boolean;
  employeeId?: string;
}

export function listLoginLogs(filters: LoginLogFilters = {}): Promise<Paginated<LoginLog>> {
  const params = new URLSearchParams();
  params.set("page", String(filters.page ?? 1));
  if (filters.type) params.set("type", filters.type);
  if (filters.successful !== undefined) params.set("successful", filters.successful ? "1" : "0");
  if (filters.employeeId) params.set("employee_id", filters.employeeId);

  return apiFetchPaginated<LoginLog>(`/admin/login-logs?${params.toString()}`);
}
