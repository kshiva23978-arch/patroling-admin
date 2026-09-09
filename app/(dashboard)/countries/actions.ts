"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { countrySchema, type CountryInput } from "@/lib/schemas/countries";
import { createCountry, deleteCountry, updateCountry } from "@/lib/resources/countries";

export async function createCountryAction(input: CountryInput): Promise<ActionResult> {
  const parsed = countrySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createCountry(parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/countries");
  redirect("/countries");
}

export async function updateCountryAction(id: string, input: CountryInput): Promise<ActionResult> {
  const parsed = countrySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateCountry(id, parsed.data);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/countries");
  redirect("/countries");
}

export async function deleteCountryAction(id: string): Promise<ActionResult> {
  try {
    await deleteCountry(id);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/countries");
  return { success: true };
}
