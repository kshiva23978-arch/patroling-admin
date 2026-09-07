"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { beachCreateSchema, beachUpdateSchema, type BeachCreateInput, type BeachUpdateInput } from "@/lib/schemas/beaches";
import { createBeach, deleteBeach, updateBeach } from "@/lib/resources/beaches";

export async function createBeachAction(input: BeachCreateInput): Promise<ActionResult> {
  const parsed = beachCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createBeach(parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/beaches");
  redirect("/beaches");
}

export async function updateBeachAction(id: string, input: BeachUpdateInput): Promise<ActionResult> {
  const parsed = beachUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateBeach(id, parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/beaches");
  redirect("/beaches");
}

export async function deleteBeachAction(id: string): Promise<ActionResult> {
  try {
    await deleteBeach(id);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/beaches");
  return { success: true };
}
