"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { beatCreateSchema, beatUpdateSchema, type BeatCreateInput, type BeatUpdateInput } from "@/lib/schemas/beats";
import { createBeat, deleteBeat, updateBeat } from "@/lib/resources/beats";

export async function createBeatAction(input: BeatCreateInput): Promise<ActionResult> {
  const parsed = beatCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createBeat(parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/beats");
  redirect("/beats");
}

export async function updateBeatAction(id: string, input: BeatUpdateInput): Promise<ActionResult> {
  const parsed = beatUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateBeat(id, parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/beats");
  redirect("/beats");
}

export async function deleteBeatAction(id: string): Promise<ActionResult> {
  try {
    await deleteBeat(id);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/beats");
  return { success: true };
}
