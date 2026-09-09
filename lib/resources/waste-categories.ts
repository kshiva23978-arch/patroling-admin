import "server-only";

import { apiFetch, apiFetchAll, apiFetchPaginated, type Paginated } from "@/lib/api-client";
import type { WasteCategoryInput } from "@/lib/schemas/waste-categories";

export interface WasteCategory {
  id: string;
  name: string;
  status: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export function listWasteCategories(page = 1): Promise<Paginated<WasteCategory>> {
  return apiFetchPaginated<WasteCategory>(`/admin/waste-categories?page=${page}`);
}

export function listAllWasteCategories(): Promise<WasteCategory[]> {
  return apiFetchAll<WasteCategory>("/admin/waste-categories");
}

export function getWasteCategory(id: string): Promise<WasteCategory> {
  return apiFetch<WasteCategory>(`/admin/waste-categories/${id}`);
}

export function createWasteCategory(input: WasteCategoryInput): Promise<WasteCategory> {
  return apiFetch<WasteCategory>("/admin/waste-categories", { method: "POST", body: JSON.stringify(input) });
}

export function updateWasteCategory(id: string, input: WasteCategoryInput): Promise<WasteCategory> {
  return apiFetch<WasteCategory>(`/admin/waste-categories/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteWasteCategory(id: string): Promise<void> {
  return apiFetch<void>(`/admin/waste-categories/${id}`, { method: "DELETE" });
}
