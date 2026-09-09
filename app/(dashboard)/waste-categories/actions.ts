"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { wasteCategorySchema, type WasteCategoryInput } from "@/lib/schemas/waste-categories";
import { createWasteCategory, deleteWasteCategory, updateWasteCategory } from "@/lib/resources/waste-categories";

export async function createWasteCategoryAction(input: WasteCategoryInput): Promise<ActionResult> {
  const parsed = wasteCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createWasteCategory(parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/waste-categories");
  redirect("/waste-categories");
}

export async function updateWasteCategoryAction(id: string, input: WasteCategoryInput): Promise<ActionResult> {
  const parsed = wasteCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateWasteCategory(id, parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/waste-categories");
  redirect("/waste-categories");
}

export async function deleteWasteCategoryAction(id: string): Promise<ActionResult> {
  try {
    await deleteWasteCategory(id);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/waste-categories");
  return { success: true };
}
