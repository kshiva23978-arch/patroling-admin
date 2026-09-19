"use server";

import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import {
  beachCleaningDetailsSchema,
  beachCleaningSegregationSchema,
  type BeachCleaningDetailsInput,
  type BeachCleaningSegregationInput,
} from "@/lib/schemas/beach-cleaning-activities";
import {
  addBeachCleaningSegregation,
  removeBeachCleaningSegregation,
  updateBeachCleaningActivity,
  updateBeachCleaningSegregation,
} from "@/lib/resources/beach-cleaning-activities";

export async function updateBeachCleaningActivityAction(
  id: string,
  input: BeachCleaningDetailsInput,
): Promise<ActionResult> {
  const parsed = beachCleaningDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateBeachCleaningActivity(id, parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath(`/beach-cleaning-activities/${id}`);
  return { success: true };
}

export async function addBeachCleaningSegregationAction(
  activityId: string,
  input: BeachCleaningSegregationInput,
): Promise<ActionResult> {
  const parsed = beachCleaningSegregationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await addBeachCleaningSegregation(activityId, parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath(`/beach-cleaning-activities/${activityId}`);
  return { success: true };
}

export async function updateBeachCleaningSegregationAction(
  activityId: string,
  segregationId: string,
  input: BeachCleaningSegregationInput,
): Promise<ActionResult> {
  const parsed = beachCleaningSegregationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateBeachCleaningSegregation(activityId, segregationId, parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath(`/beach-cleaning-activities/${activityId}`);
  return { success: true };
}

export async function removeBeachCleaningSegregationAction(
  activityId: string,
  segregationId: string,
): Promise<ActionResult> {
  try {
    await removeBeachCleaningSegregation(activityId, segregationId);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath(`/beach-cleaning-activities/${activityId}`);
  return { success: true };
}
