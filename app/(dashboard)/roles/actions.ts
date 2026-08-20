"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { roleSchema, type RoleInput } from "@/lib/schemas/roles";
import { createRole, deleteRole, updateRole } from "@/lib/resources/roles";

export async function createRoleAction(input: RoleInput): Promise<ActionResult> {
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createRole(parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/roles");
  redirect("/roles");
}

export async function updateRoleAction(id: string, input: RoleInput): Promise<ActionResult> {
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateRole(id, parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/roles");
  redirect("/roles");
}

export async function deleteRoleAction(id: string): Promise<ActionResult> {
  try {
    await deleteRole(id);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/roles");
  return { success: true };
}
