import Link from "next/link";
import type { PageMeta } from "@/lib/api-client";
import { linkButtonClass } from "@/lib/ui-classes";

export function Pagination({
  meta,
  basePath,
  extraParams,
}: {
  meta?: PageMeta;
  basePath: string;
  extraParams?: Record<string, string | undefined>;
}) {
  if (!meta || meta.last_page <= 1) return null;

  const prevDisabled = meta.current_page <= 1;
  const nextDisabled = meta.current_page >= meta.last_page;

  const hrefFor = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(extraParams ?? {})) {
      if (value) params.set(key, value);
    }
    params.set("page", String(page));
    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-sm text-zinc-500">
        Page {meta.current_page} of {meta.last_page} &middot; {meta.total} total
      </p>
      <div className="flex gap-2">
        <Link
          href={hrefFor(meta.current_page - 1)}
          aria-disabled={prevDisabled}
          className={`${linkButtonClass} ${prevDisabled ? "pointer-events-none opacity-50" : ""}`}
        >
          Previous
        </Link>
        <Link
          href={hrefFor(meta.current_page + 1)}
          aria-disabled={nextDisabled}
          className={`${linkButtonClass} ${nextDisabled ? "pointer-events-none opacity-50" : ""}`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}
