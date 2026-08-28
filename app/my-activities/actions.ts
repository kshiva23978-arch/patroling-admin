"use server";

import { redirect } from "next/navigation";
import { ngoFetch } from "@/lib/ngo-client";
import { destroyNgoSession } from "@/lib/ngo-session";

export async function ngoLogoutAction() {
  try {
    await ngoFetch("/app/logout", { method: "POST" });
  } catch {
    // Token may already be invalid/expired — still clear the local session below.
  }

  await destroyNgoSession();
  redirect("/ngo-login");
}
