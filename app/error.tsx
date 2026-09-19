"use client";

import { useEffect } from "react";
import { primaryButtonClass } from "@/lib/ui-classes";

function isBackendUnreachable(error: Error): boolean {
  // Node's fetch (undici) throws a generic TypeError("fetch failed") whose
  // `cause` carries the real reason — a connect timeout to the backend
  // (e.g. gsmchatham.andamannicobar.gov.in) surfaces as UND_ERR_CONNECT_TIMEOUT.
  const cause = (error as Error & { cause?: { code?: string } }).cause;
  return (
    error.message === "fetch failed" ||
    cause?.code === "UND_ERR_CONNECT_TIMEOUT" ||
    cause?.code === "ECONNREFUSED" ||
    cause?.code === "ETIMEDOUT" ||
    cause?.code === "ENOTFOUND"
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const backendDown = isBackendUnreachable(error);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-lg font-semibold text-zinc-900">
        {backendDown ? "Can't reach the backend server" : "Something went wrong"}
      </h1>
      <p className="max-w-md text-sm text-zinc-500">
        {backendDown
          ? "The connection to the Patrolling backend timed out. It may be temporarily down or unreachable from this network — please try again in a moment."
          : "An unexpected error occurred while loading this page."}
      </p>
      <button type="button" onClick={reset} className={primaryButtonClass}>
        Try again
      </button>
    </div>
  );
}
