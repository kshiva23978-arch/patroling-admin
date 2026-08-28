"use server";

import { redirect } from "next/navigation";
import { ngoFetch } from "@/lib/ngo-client";
import { createNgoSession } from "@/lib/ngo-session";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";

interface AppLoginResponse {
  employee_id: string;
  token: string;
  name?: string | null;
}

/**
 * NGO/organization accounts have no admin-table login of their own — this
 * signs them in with their existing field-app credentials (`/app/login`,
 * the same endpoint the Flutter app uses) and stores the result in the
 * separate NGO session (see `lib/ngo-session.ts`), never the admin one.
 */
export async function ngoLoginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  let response: AppLoginResponse;
  try {
    response = await ngoFetch<AppLoginResponse>("/app/login", {
      method: "POST",
      body: JSON.stringify({
        employee_id: parsed.data.employeeId,
        password: parsed.data.password,
      }),
    });
  } catch (err) {
    return toActionResult(err);
  }

  await createNgoSession(response.token, response.employee_id, response.name);
  redirect("/my-activities");
}
