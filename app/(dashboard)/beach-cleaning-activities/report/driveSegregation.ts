import type { BeachCleaningActivity } from "@/lib/resources/beach-cleaning-activities";

export const MEDIA_BASE_URL = "/api/beach-cleaning-media";

export interface DriveSegregationGrid {
  recordedCountries: string[];
  recordedCategories: string[];
  matrix: Record<string, Record<string, number>>;
  categoryTotals: Record<string, number>;
}

/**
 * Builds the kg-only, recorded-only-rows/columns country x category grid for
 * one drive's own `segregations` — shared by the on-screen `DriveWiseSection`
 * table and the PDF export so both render the exact same numbers.
 */
export function buildDriveSegregationGrid(
  activity: BeachCleaningActivity,
  countries: string[],
  categories: string[],
): DriveSegregationGrid {
  const matrix: Record<string, Record<string, number>> = {};
  for (const country of countries) {
    matrix[country] = Object.fromEntries(categories.map((c) => [c, 0]));
  }
  for (const segregation of activity.segregations) {
    const countryName = segregation.country?.name;
    const categoryName = segregation.waste_category?.name;
    if (!countryName || !categoryName || !matrix[countryName] || !(categoryName in matrix[countryName])) continue;
    matrix[countryName][categoryName] += segregation.weight_kg ?? 0;
  }

  const recordedCountries = countries.filter((country) => categories.some((c) => matrix[country][c] > 0));
  const recordedCategories = categories.filter((category) => recordedCountries.some((c) => matrix[c][category] > 0));

  const categoryTotals = Object.fromEntries(recordedCategories.map((c) => [c, 0])) as Record<string, number>;
  for (const country of recordedCountries) {
    for (const category of recordedCategories) {
      categoryTotals[category] += matrix[country][category];
    }
  }

  return { recordedCountries, recordedCategories, matrix, categoryTotals };
}

export function officerLabel(officer: { employee_id: string; name: string | null } | null): string {
  if (!officer) return "—";
  return officer.name ? `${officer.name} (${officer.employee_id})` : officer.employee_id;
}
