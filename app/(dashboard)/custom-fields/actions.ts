"use server";

import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { customFieldSchema, type CustomFieldInput } from "@/lib/schemas/custom-fields";
import { createCustomField, deleteCustomField, updateCustomField } from "@/lib/resources/custom-fields";

function toPayload(input: CustomFieldInput) {
  return {
    field_name: input.fieldName,
    input_type: input.inputType,
    options: input.inputType === "dropdown" ? input.options : undefined,
    is_required: input.isRequired,
    is_active: input.isActive,
  };
}

export async function createCustomFieldAction(rangeId: string, input: CustomFieldInput): Promise<ActionResult> {
  const parsed = customFieldSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createCustomField(rangeId, toPayload(parsed.data));
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/custom-fields");
  return { success: true };
}

export async function updateCustomFieldAction(id: string, input: CustomFieldInput): Promise<ActionResult> {
  const parsed = customFieldSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateCustomField(id, toPayload(parsed.data));
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/custom-fields");
  return { success: true };
}

export async function toggleCustomFieldActiveAction(id: string, current: CustomFieldInput): Promise<ActionResult> {
  return updateCustomFieldAction(id, { ...current, isActive: !current.isActive });
}

export async function deleteCustomFieldAction(id: string): Promise<ActionResult> {
  try {
    await deleteCustomField(id);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/custom-fields");
  return { success: true };
}
