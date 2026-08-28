"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { staffCreateSchema, staffUpdateSchema, type StaffCreateInput, type StaffUpdateInput } from "@/lib/schemas/staff";
import { createStaff, deleteStaff, updateStaff } from "@/lib/resources/staff";

export async function createStaffAction(input: StaffCreateInput): Promise<ActionResult> {
  const parsed = staffCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createStaff(parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/staff");
  redirect("/staff");
}

export async function updateStaffAction(id: string, input: StaffUpdateInput): Promise<ActionResult> {
  const parsed = staffUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateStaff(id, parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/staff");
  redirect("/staff");
}

export async function deleteStaffAction(id: string): Promise<ActionResult> {
  try {
    await deleteStaff(id);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/staff");
  return { success: true };
}
