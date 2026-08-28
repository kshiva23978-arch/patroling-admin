"use server";

import { getCaseEntry, listCaseRoutePoints } from "@/lib/resources/case-entries";
import type { CaseEntry, CaseRoutePoint } from "@/lib/resources/case-entries";

/** Polled to refresh status/travel-mode/staff while watching a case. */
export async function fetchCaseEntryAction(id: string): Promise<CaseEntry> {
  return getCaseEntry(id);
}

/** Polled to append new GPS points to the live-tracking map. */
export async function fetchCaseRoutePointsAction(id: string, since?: string): Promise<CaseRoutePoint[]> {
  return listCaseRoutePoints(id, since);
}
