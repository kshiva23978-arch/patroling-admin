"use server";

import { getPatrolling, listRoutePoints } from "@/lib/resources/patrollings";
import type { Patrolling, PatrolRoutePoint } from "@/lib/resources/patrollings";

/** Polled to refresh status/travel-mode/staff while watching a patrol. */
export async function fetchPatrollingAction(id: string): Promise<Patrolling> {
  return getPatrolling(id);
}

/** Polled to append new GPS points to the live-tracking map. */
export async function fetchRoutePointsAction(id: string, since?: string): Promise<PatrolRoutePoint[]> {
  return listRoutePoints(id, since);
}
