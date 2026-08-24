import "server-only";

import { apiFetch } from "@/lib/api-client";

export type CustomFieldInputType = "text" | "boolean" | "dropdown" | "time" | "date" | "number";

export interface CustomField {
  id: string;
  range_id: string;
  field_name: string;
  field_key: string;
  input_type: CustomFieldInputType;
  options: string[];
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CustomFieldPayload {
  field_name: string;
  input_type: CustomFieldInputType;
  options?: string[];
  is_required: boolean;
  is_active: boolean;
}

/** Every custom field for a range (active and disabled) — the admin management screen. */
export function listCustomFields(rangeId: string): Promise<CustomField[]> {
  return apiFetch<CustomField[]>(`/admin/custom-fields?range_id=${rangeId}`);
}

export function createCustomField(rangeId: string, input: CustomFieldPayload): Promise<CustomField> {
  return apiFetch<CustomField>("/admin/custom-fields", {
    method: "POST",
    body: JSON.stringify({ range_id: rangeId, ...input }),
  });
}

export function updateCustomField(id: string, input: CustomFieldPayload): Promise<CustomField> {
  return apiFetch<CustomField>(`/admin/custom-fields/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function deleteCustomField(id: string): Promise<void> {
  return apiFetch<void>(`/admin/custom-fields/${id}`, { method: "DELETE" });
}
