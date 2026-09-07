"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { activityCategorySchema, type ActivityCategoryInput } from "@/lib/schemas/activity-categories";
import {
  createActivityCategory,
  deleteActivityCategory,
  updateActivityCategory,
} from "@/lib/resources/activity-categories";

export async function createActivityCategoryAction(input: ActivityCategoryInput): Promise<ActionResult> {
  const parsed = activityCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createActivityCategory(parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/activity-categories");
  redirect("/activity-categories");
}

export async function updateActivityCategoryAction(id: string, input: ActivityCategoryInput): Promise<ActionResult> {
  const parsed = activityCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateActivityCategory(id, parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/activity-categories");
  redirect("/activity-categories");
}

export async function deleteActivityCategoryAction(id: string): Promise<ActionResult> {
  try {
    await deleteActivityCategory(id);
  } catch (err) {
    return toActionResult(err);
  }
  revalidatePath("/activity-categories");
  return { success: true };
}
