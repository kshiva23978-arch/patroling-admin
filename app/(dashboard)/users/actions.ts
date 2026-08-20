"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { userCreateSchema, userUpdateSchema, type UserCreateInput, type UserUpdateInput } from "@/lib/schemas/users";
import { userDetailsSchema, type UserDetailsInput } from "@/lib/schemas/user-details";
import { createUser, updateUser } from "@/lib/resources/users";
import { saveUserDetails } from "@/lib/resources/user-details";
import { grantRangeAccess, revokeRangeAccess } from "@/lib/resources/user-range-access";

export async function createUserAction(input: UserCreateInput): Promise<ActionResult> {
  const parsed = userCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createUser(parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/users");
  redirect("/users");
}

export async function updateUserAction(id: string, input: UserUpdateInput): Promise<ActionResult> {
  const parsed = userUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateUser(id, parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/users");
  redirect("/users");
}

export async function saveUserDetailsAction(userId: string, input: UserDetailsInput): Promise<ActionResult> {
  const parsed = userDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await saveUserDetails(userId, parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath(`/users/${userId}/edit`);
  return { success: true };
}

export async function grantRangeAccessAction(userId: string, rangeId: string): Promise<ActionResult> {
  if (!rangeId) {
    return { success: false, message: "Select a range first." };
  }

  try {
    await grantRangeAccess(userId, rangeId);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath(`/users/${userId}/edit`);
  return { success: true };
}

export async function revokeRangeAccessAction(userId: string, rangeId: string): Promise<ActionResult> {
  try {
    await revokeRangeAccess(userId, rangeId);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath(`/users/${userId}/edit`);
  return { success: true };
}
