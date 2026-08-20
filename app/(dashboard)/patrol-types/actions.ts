"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { patrolTypeSchema, type PatrolTypeInput } from "@/lib/schemas/patrol-types";
import { createPatrolType, deletePatrolType, updatePatrolType } from "@/lib/resources/patrol-types";

export async function createPatrolTypeAction(input: PatrolTypeInput): Promise<ActionResult> {
  const parsed = patrolTypeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createPatrolType(parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/patrol-types");
  redirect("/patrol-types");
}

export async function updatePatrolTypeAction(id: string, input: PatrolTypeInput): Promise<ActionResult> {
  const parsed = patrolTypeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updatePatrolType(id, parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/patrol-types");
  redirect("/patrol-types");
}

export async function deletePatrolTypeAction(id: string): Promise<ActionResult> {
  try {
    await deletePatrolType(id);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/patrol-types");
  return { success: true };
}
