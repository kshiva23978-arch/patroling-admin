import "server-only";

import { apiFetch } from "@/lib/api-client";
import type { ReportFieldInputType } from "@/lib/schemas/activity-report-fields";

export interface ReportField {
  id: string;
  category_id: string;
  group_id: string | null;
  field_name: string;
  field_key: string;
  input_type: ReportFieldInputType;
  options: string[];
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface ReportFieldGroup {
  id: string;
  category_id: string;
  name: string;
  key: string;
  sort_order: number;
  fields: ReportField[];
  created_at: string | null;
  updated_at: string | null;
}

export interface ReportFieldsData {
  groups: ReportFieldGroup[];
  fields: ReportField[];
}

export interface ReportFieldPayload {
  field_name: string;
  input_type: ReportFieldInputType;
  options?: string[];
  is_required: boolean;
  is_active: boolean;
}

/** Every group (with its fields) and every flat field for a category — the admin management screen. */
export function listReportFields(categoryId: string): Promise<ReportFieldsData> {
  return apiFetch<ReportFieldsData>(`/admin/activity-report-fields?category_id=${categoryId}`);
}

export function createReportFieldGroup(categoryId: string, name: string): Promise<ReportFieldGroup> {
  return apiFetch<ReportFieldGroup>("/admin/activity-report-field-groups", {
    method: "POST",
    body: JSON.stringify({ category_id: categoryId, name }),
  });
}

export function updateReportFieldGroup(id: string, name: string): Promise<ReportFieldGroup> {
  return apiFetch<ReportFieldGroup>(`/admin/activity-report-field-groups/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name }),
  });
}

export function deleteReportFieldGroup(id: string): Promise<void> {
  return apiFetch<void>(`/admin/activity-report-field-groups/${id}`, { method: "DELETE" });
}

export function createReportField(
  categoryId: string,
  groupId: string | null,
  input: ReportFieldPayload,
): Promise<ReportField> {
  return apiFetch<ReportField>("/admin/activity-report-fields", {
    method: "POST",
    body: JSON.stringify({ category_id: categoryId, group_id: groupId, ...input }),
  });
}

export function updateReportField(id: string, input: ReportFieldPayload): Promise<ReportField> {
  return apiFetch<ReportField>(`/admin/activity-report-fields/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteReportField(id: string): Promise<void> {
  return apiFetch<void>(`/admin/activity-report-fields/${id}`, { method: "DELETE" });
}
