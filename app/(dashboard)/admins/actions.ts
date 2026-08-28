"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { adminCreateSchema, adminUpdateSchema, type AdminCreateInput, type AdminUpdateInput } from "@/lib/schemas/admins";
import { createAdmin, deleteAdmin, updateAdmin } from "@/lib/resources/admins";
import { grantAdminRangeAccess, revokeAdminRangeAccess } from "@/lib/resources/admin-range-access";
import { getCurrentAdmin } from "@/lib/auth";

export async function createAdminAction(input: AdminCreateInput): Promise<ActionResult> {
  const parsed = adminCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createAdmin(parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/admins");
  redirect("/admins");
}

export async function updateAdminAction(id: string, input: AdminUpdateInput): Promise<ActionResult> {
  const parsed = adminUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateAdmin(id, parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/admins");
  redirect("/admins");
}

export async function deleteAdminAction(id: string): Promise<ActionResult> {
  const currentAdmin = await getCurrentAdmin();
  if (currentAdmin?.a_id === id) {
    return { success: false, message: "You cannot delete your own admin account." };
  }

  try {
    await deleteAdmin(id);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/admins");
  return { success: true };
}

export async function grantAdminRangeAccessAction(adminId: string, rangeId: string): Promise<ActionResult> {
  if (!rangeId) {
    return { success: false, message: "Select a range first." };
  }

  try {
    await grantAdminRangeAccess(adminId, rangeId);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath(`/admins/${adminId}/edit`);
  return { success: true };
}

export async function revokeAdminRangeAccessAction(adminId: string, rangeId: string): Promise<ActionResult> {
  try {
    await revokeAdminRangeAccess(adminId, rangeId);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath(`/admins/${adminId}/edit`);
  return { success: true };
}
