"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { rangeSchema, type RangeInput } from "@/lib/schemas/ranges";
import { createRange, deleteRange, updateRange } from "@/lib/resources/ranges";

export async function createRangeAction(input: RangeInput): Promise<ActionResult> {
  const parsed = rangeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createRange(parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/ranges");
  redirect("/ranges");
}

export async function updateRangeAction(id: string, input: RangeInput): Promise<ActionResult> {
  const parsed = rangeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateRange(id, parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/ranges");
  redirect("/ranges");
}

export async function deleteRangeAction(id: string): Promise<ActionResult> {
  try {
    await deleteRange(id);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/ranges");
  return { success: true };
}
