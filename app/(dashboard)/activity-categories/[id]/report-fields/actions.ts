"use server";

import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import {
  reportFieldGroupSchema,
  reportFieldSchema,
  type ReportFieldGroupInput,
  type ReportFieldInput,
} from "@/lib/schemas/activity-report-fields";
import {
  createReportField,
  createReportFieldGroup,
  deleteReportField,
  deleteReportFieldGroup,
  updateReportField,
  updateReportFieldGroup,
} from "@/lib/resources/activity-report-fields";

function toFieldPayload(input: ReportFieldInput) {
  return {
    field_name: input.fieldName,
    input_type: input.inputType,
    options: input.inputType === "dropdown" ? input.options : undefined,
    is_required: input.isRequired,
    is_active: input.isActive,
  };
}

export async function createReportFieldGroupAction(
  categoryId: string,
  input: ReportFieldGroupInput,
): Promise<ActionResult> {
  const parsed = reportFieldGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createReportFieldGroup(categoryId, parsed.data.name);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath(`/activity-categories/${categoryId}/report-fields`);
  return { success: true };
}

export async function updateReportFieldGroupAction(
  categoryId: string,
  groupId: string,
  input: ReportFieldGroupInput,
): Promise<ActionResult> {
  const parsed = reportFieldGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateReportFieldGroup(groupId, parsed.data.name);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath(`/activity-categories/${categoryId}/report-fields`);
  return { success: true };
}

export async function deleteReportFieldGroupAction(categoryId: string, groupId: string): Promise<ActionResult> {
  try {
    await deleteReportFieldGroup(groupId);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath(`/activity-categories/${categoryId}/report-fields`);
  return { success: true };
}

export async function createReportFieldAction(
  categoryId: string,
  groupId: string | null,
  input: ReportFieldInput,
): Promise<ActionResult> {
  const parsed = reportFieldSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await createReportField(categoryId, groupId, toFieldPayload(parsed.data));
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath(`/activity-categories/${categoryId}/report-fields`);
  return { success: true };
}

export async function updateReportFieldAction(
  categoryId: string,
  fieldId: string,
  input: ReportFieldInput,
): Promise<ActionResult> {
  const parsed = reportFieldSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateReportField(fieldId, toFieldPayload(parsed.data));
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath(`/activity-categories/${categoryId}/report-fields`);
  return { success: true };
}

export async function toggleReportFieldActiveAction(
  categoryId: string,
  fieldId: string,
  current: ReportFieldInput,
): Promise<ActionResult> {
  return updateReportFieldAction(categoryId, fieldId, { ...current, isActive: !current.isActive });
}

export async function deleteReportFieldAction(categoryId: string, fieldId: string): Promise<ActionResult> {
  try {
    await deleteReportField(fieldId);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath(`/activity-categories/${categoryId}/report-fields`);
  return { success: true };
}
