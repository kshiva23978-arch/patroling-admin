"use server";

import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { deleteBeachCleaningActivity } from "@/lib/resources/beach-cleaning-activities";

export async function deleteBeachCleaningActivityAction(id: string): Promise<ActionResult> {
  try {
    await deleteBeachCleaningActivity(id);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/beach-cleaning-activities");
  return { success: true };
}
