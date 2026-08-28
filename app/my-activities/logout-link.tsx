"use client";

import { useTransition } from "react";
import { secondaryButtonClass } from "@/lib/ui-classes";
import { ngoLogoutAction } from "./actions";

export function LogoutLink() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={secondaryButtonClass}
      disabled={isPending}
      onClick={() => startTransition(() => ngoLogoutAction())}
    >
      Sign out
    </button>
  );
}
