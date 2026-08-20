"use client";

import { useTransition } from "react";
import { logoutAction } from "@/app/(dashboard)/actions";
import { secondaryButtonClass } from "@/lib/ui-classes";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={secondaryButtonClass}
      disabled={isPending}
      onClick={() => startTransition(() => logoutAction())}
    >
      {isPending ? "Signing out…" : "Sign out"}
    </button>
  );
}
