"use server";

import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api-client";
import { destroySession } from "@/lib/session";

export async function logoutAction() {
  try {
    await apiFetch("/admin/logout", { method: "POST" });
  } catch (err) {
    // Best-effort revocation — even if the backend call fails (token already
    // expired, network hiccup), the local session must still be cleared.
    if (!(err instanceof ApiError)) {
      throw err;
    }
  } finally {
    await destroySession();
  }
  redirect("/login");
}
