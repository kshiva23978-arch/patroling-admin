"use server";

import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { deleteCaseEntry } from "@/lib/resources/case-entries";

export async function deleteCaseEntryAction(id: string): Promise<ActionResult> {
  try {
    await deleteCaseEntry(id);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/case-entries");
  return { success: true };
}
