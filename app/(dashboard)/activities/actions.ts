"use server";

import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { deleteActivity } from "@/lib/resources/activities";

export async function deleteActivityAction(id: string): Promise<ActionResult> {
  try {
    await deleteActivity(id);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/activities");
  return { success: true };
}
