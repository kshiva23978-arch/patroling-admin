"use server";

import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { appVersionSchema, type AppVersionFormInput } from "@/lib/schemas/app-versions";
import { updateAppVersion, type AppPlatform } from "@/lib/resources/app-versions";

export async function updateAppVersionAction(platform: AppPlatform, input: AppVersionFormInput): Promise<ActionResult> {
  const parsed = appVersionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateAppVersion(platform, {
      ...parsed.data,
      update_url: parsed.data.update_url || null,
      release_notes: parsed.data.release_notes || null,
    });
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/app-versions");
  return { success: true };
}
