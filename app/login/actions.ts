"use server";

import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { createSession } from "@/lib/session";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";

interface LoginResponse {
  employee_id: string;
  token: string;
}

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please check your input.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let response: LoginResponse;
  try {
    response = await apiFetch<LoginResponse>("/admin/login", {
      method: "POST",
      body: JSON.stringify({
        employee_id: parsed.data.employeeId,
        password: parsed.data.password,
      }),
    });
  } catch (err) {
    return toActionResult(err);
  }

  await createSession(response.token, response.employee_id);
  redirect("/dashboard");
}
