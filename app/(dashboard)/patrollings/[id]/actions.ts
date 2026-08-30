"use server";

import { toActionResult } from "@/lib/action-result";
import { addPatrolComment, getPatrolling, listRoutePoints } from "@/lib/resources/patrollings";
import type { Patrolling, PatrolCommentRef, PatrolRoutePoint } from "@/lib/resources/patrollings";

/** Polled to refresh status/travel-mode/staff while watching a patrol. */
export async function fetchPatrollingAction(id: string): Promise<Patrolling> {
  return getPatrolling(id);
}

/** Polled to append new GPS points to the live-tracking map. */
export async function fetchRoutePointsAction(id: string, since?: string): Promise<PatrolRoutePoint[]> {
  return listRoutePoints(id, since);
}

export type AddCommentResult =
  | { success: true; comment: PatrolCommentRef }
  | { success: false; message: string; fieldErrors?: Record<string, string[]> };

export async function addPatrolCommentAction(id: string, text: string): Promise<AddCommentResult> {
  try {
    const comment = await addPatrolComment(id, text);
    return { success: true, comment };
  } catch (err) {
    const result = toActionResult(err);
    return result.success ? { success: false, message: "Something went wrong. Please try again." } : result;
  }
}
