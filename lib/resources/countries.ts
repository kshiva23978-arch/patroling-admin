import "server-only";

import { apiFetch, apiFetchAll, apiFetchPaginated, type Paginated } from "@/lib/api-client";
import type { CountryInput } from "@/lib/schemas/countries";

export interface Country {
  id: string;
  country_name: string;
  created_at: string | null;
  updated_at: string | null;
}

function toPayload(input: CountryInput) {
  return { co_country_name: input.name };
}

export function listCountries(page = 1): Promise<Paginated<Country>> {
  return apiFetchPaginated<Country>(`/admin/countries?page=${page}`);
}

export function listAllCountries(): Promise<Country[]> {
  return apiFetchAll<Country>("/admin/countries");
}

export function getCountry(id: string): Promise<Country> {
  return apiFetch<Country>(`/admin/countries/${id}`);
}

export function createCountry(input: CountryInput): Promise<Country> {
  return apiFetch<Country>("/admin/countries", { method: "POST", body: JSON.stringify(toPayload(input)) });
}

export function updateCountry(id: string, input: CountryInput): Promise<Country> {
  return apiFetch<Country>(`/admin/countries/${id}`, { method: "PUT", body: JSON.stringify(toPayload(input)) });
}

export function deleteCountry(id: string): Promise<void> {
  return apiFetch<void>(`/admin/countries/${id}`, { method: "DELETE" });
}
