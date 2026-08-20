"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { patrollingModeSchema, type PatrollingModeInput } from "@/lib/schemas/patrolling-modes";
import { createPatrollingMode, deletePatrollingMode, updatePatrollingMode } from "@/lib/resources/patrolling-modes";

export async function createPatrollingModeAction(input: PatrollingModeInput): Promise<ActionResult> {
  const parsed = patrollingModeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createPatrollingMode(parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/patrolling-modes");
  redirect("/patrolling-modes");
}

export async function updatePatrollingModeAction(id: string, input: PatrollingModeInput): Promise<ActionResult> {
  const parsed = patrollingModeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updatePatrollingMode(id, parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/patrolling-modes");
  redirect("/patrolling-modes");
}

export async function deletePatrollingModeAction(id: string): Promise<ActionResult> {
  try {
    await deletePatrollingMode(id);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/patrolling-modes");
  return { success: true };
}
