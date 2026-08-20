"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";
import { dangerButtonClass } from "@/lib/ui-classes";

interface ConfirmDeleteButtonProps {
  action: () => Promise<ActionResult>;
  confirmMessage?: string;
  successMessage?: string;
  label?: string;
}

export function ConfirmDeleteButton({
  action,
  confirmMessage = "Are you sure you want to delete this record? This cannot be undone.",
  successMessage = "Deleted.",
  label = "Delete",
}: ConfirmDeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (!window.confirm(confirmMessage)) return;

    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success(successMessage);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <button type="button" className={dangerButtonClass} disabled={isPending} onClick={handleClick}>
      {isPending ? "Deleting…" : label}
    </button>
  );
}
