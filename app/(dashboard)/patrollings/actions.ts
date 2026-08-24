"use server";

import { listActivity, listPatrollings, type ActivityRow, type Patrolling, type PatrolStatus } from "@/lib/resources/patrollings";
import type { Paginated } from "@/lib/api-client";

/** Polled from the client-side table every few seconds for a live view. */
export async function fetchPatrollingsAction(
  page: number,
  status?: PatrolStatus,
  rangeId?: string,
): Promise<Paginated<Patrolling>> {
  return listPatrollings(page, status, rangeId);
}

/** Polled from the client-side table for the "Case" / "All" type views. */
export async function fetchActivityAction(
  page: number,
  type: "case" | "all",
  status?: PatrolStatus,
  rangeId?: string,
): Promise<Paginated<ActivityRow>> {
  return listActivity(page, type, status, rangeId);
}
