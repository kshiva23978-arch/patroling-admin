"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { vehicleCreateSchema, vehicleUpdateSchema, type VehicleCreateInput, type VehicleUpdateInput } from "@/lib/schemas/vehicles";
import { createVehicle, deleteVehicle, updateVehicle } from "@/lib/resources/vehicles";

export async function createVehicleAction(input: VehicleCreateInput): Promise<ActionResult> {
  const parsed = vehicleCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createVehicle(parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/vehicles");
  redirect("/vehicles");
}

export async function updateVehicleAction(id: string, input: VehicleUpdateInput): Promise<ActionResult> {
  const parsed = vehicleUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateVehicle(id, parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/vehicles");
  redirect("/vehicles");
}

export async function deleteVehicleAction(id: string): Promise<ActionResult> {
  try {
    await deleteVehicle(id);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/vehicles");
  return { success: true };
}
