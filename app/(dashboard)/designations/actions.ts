"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { designationSchema, type DesignationInput } from "@/lib/schemas/designations";
import { createDesignation, deleteDesignation, updateDesignation } from "@/lib/resources/designations";

export async function createDesignationAction(input: DesignationInput): Promise<ActionResult> {
  const parsed = designationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createDesignation(parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/designations");
  redirect("/designations");
}

export async function updateDesignationAction(id: string, input: DesignationInput): Promise<ActionResult> {
  const parsed = designationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateDesignation(id, parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/designations");
  redirect("/designations");
}

export async function deleteDesignationAction(id: string): Promise<ActionResult> {
  try {
    await deleteDesignation(id);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/designations");
  return { success: true };
}
