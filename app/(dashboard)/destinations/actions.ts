"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { destinationSchema, type DestinationInput } from "@/lib/schemas/destinations";
import { createDestination, deleteDestination, updateDestination } from "@/lib/resources/destinations";

export async function createDestinationAction(input: DestinationInput): Promise<ActionResult> {
  const parsed = destinationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createDestination(parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/destinations");
  redirect("/destinations");
}

export async function updateDestinationAction(id: string, input: DestinationInput): Promise<ActionResult> {
  const parsed = destinationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateDestination(id, parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/destinations");
  redirect("/destinations");
}

export async function deleteDestinationAction(id: string): Promise<ActionResult> {
  try {
    await deleteDestination(id);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/destinations");
  return { success: true };
}
