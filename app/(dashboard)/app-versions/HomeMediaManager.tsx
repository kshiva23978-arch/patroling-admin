"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { cardClass, inputClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui-classes";
import type { HomeMedia } from "@/lib/resources/home-media";
import { deleteHomeMediaAction, setHomeMediaActiveAction, uploadHomeMediaAction } from "./actions";

/**
 * Hard cap for any home-screen file. Vercel rejects request bodies over
 * ~4.5 MB with a 413 before the Server Action runs, and the app downloads
 * this before login on mobile data, so keep it small. Checking here gives a
 * clear message instead of a failed request that crashes the page.
 */
const MAX_UPLOAD_BYTES = 1 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Upload + pick-one for the field app's launch screen. Whichever item is
 * "Active" is shown full-screen (with a Login button) every time the app
 * opens; with nothing active the app goes straight to login/dashboard.
 * Activating one item deactivates the previous one server-side.
 */
export function HomeMediaManager({ items }: { items: HomeMedia[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [activateOnUpload, setActivateOnUpload] = useState(items.length === 0);
  const [preview, setPreview] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const active = items.find((m) => m.is_active) ?? null;

  const onFileChange = (file: File | null) => {
    if (preview) URL.revokeObjectURL(preview.url);
    if (!file) return setPreview(null);
    setPreview({ url: URL.createObjectURL(file), type: file.type.startsWith("video/") ? "video" : "image" });
  };

  const upload = (form: FormData) => {
    setError(null);
    const file = form.get("file");
    if (file instanceof File && file.size > MAX_UPLOAD_BYTES) {
      setError(
        `This file is ${formatBytes(file.size)} — uploads must be 1 MB or smaller. Please compress it and try again.`,
      );
      return;
    }
    if (activateOnUpload) form.set("activate", "1");
    startTransition(async () => {
      let result;
      try {
        result = await uploadHomeMediaAction(form);
      } catch {
        // A rejected call means the request never got a proper response
        // (413 from the host, network drop, timeout) — show it inline
        // rather than letting it bubble to the page's error boundary.
        setError("Upload failed — the file may be too large for the server (max 1 MB), or the connection dropped. Please try a smaller file.");
        return;
      }
      if (!result.success) {
        setError(result.message);
        return;
      }
      toast.success("Uploaded.");
      formRef.current?.reset();
      onFileChange(null);
    });
  };

  const run = (label: string, action: () => Promise<{ success: boolean; message?: string }>) => {
    setError(null);
    startTransition(async () => {
      let result;
      try {
        result = await action();
      } catch {
        setError("Something went wrong. Please try again.");
        return;
      }
      if (!result.success) {
        setError(result.message ?? "Something went wrong.");
        return;
      }
      toast.success(label);
    });
  };

  return (
    <div className={`space-y-5 p-5 ${cardClass}`}>
      <div>
        <h2 className="text-base font-semibold text-zinc-900">Home Screen Media</h2>
        <p className="mt-1 text-sm text-zinc-500">
          An image or video shown full-screen when the app opens, with a Login button. Only one can be active; with none
          active the app opens directly on login/dashboard.
        </p>
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div
        className={`rounded-md border px-3 py-2 text-sm ${
          active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-zinc-200 bg-zinc-50 text-zinc-600"
        }`}
      >
        {active ? (
          <>
            Home screen is <strong>on</strong> — showing {active.type} {active.title ? `“${active.title}”` : ""}.
          </>
        ) : (
          <>
            Home screen is <strong>off</strong> — the app opens directly on login/dashboard.
          </>
        )}
      </div>

      <form ref={formRef} action={upload} className="space-y-3 rounded-lg border border-dashed border-zinc-300 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className={labelClass}>Image or video</label>
            <input
              type="file"
              name="file"
              required
              accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,image/jpeg,image/png,image/webp,video/mp4,video/webm"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-700"
            />
            <p className="text-xs text-zinc-500">
              JPG, PNG, WebP, MP4 or WebM up to <strong>1 MB</strong> (compress images; keep videos to a few seconds). Portrait 9:16 fits phones best.
            </p>
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Title (optional)</label>
            <input type="text" name="title" maxLength={150} className={inputClass} placeholder="e.g. Wildlife Week 2026" />
          </div>
        </div>

        {preview && (
          <div className="max-w-xs overflow-hidden rounded-md border border-zinc-200 bg-black">
            {preview.type === "video" ? (
              <video src={preview.url} controls muted className="max-h-64 w-full object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.url} alt="Preview" className="max-h-64 w-full object-contain" />
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={activateOnUpload}
              onChange={(e) => setActivateOnUpload(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
            />
            Make active immediately
          </label>
          <button type="submit" disabled={isPending} className={primaryButtonClass}>
            {isPending ? "Working…" : "Upload"}
          </button>
        </div>
      </form>

      {items.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <li
              key={m.id}
              className={`overflow-hidden rounded-lg border ${m.is_active ? "border-emerald-400 ring-2 ring-emerald-200" : "border-zinc-200"}`}
            >
              <div className="flex h-40 items-center justify-center bg-black">
                {m.type === "video" ? (
                  <video src={m.url} controls muted preload="metadata" className="h-full w-full object-contain" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.title ?? "Home media"} className="h-full w-full object-contain" />
                )}
              </div>
              <div className="space-y-2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">{m.title || (m.type === "video" ? "Video" : "Image")}</p>
                    <p className="text-xs text-zinc-500">
                      {m.type} · {formatBytes(m.file_size)}
                      {m.created_at && ` · ${new Date(m.created_at).toLocaleDateString("en-IN")}`}
                    </p>
                  </div>
                  {m.is_active && (
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">Active</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {m.is_active ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => run("Home screen turned off.", () => setHomeMediaActiveAction(m.id, false))}
                      className={`${secondaryButtonClass} flex-1`}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => run("Now showing on the home screen.", () => setHomeMediaActiveAction(m.id, true))}
                      className={`${primaryButtonClass} flex-1`}
                    >
                      Set active
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      if (window.confirm("Delete this media? This cannot be undone.")) {
                        run("Deleted.", () => deleteHomeMediaAction(m.id));
                      }
                    }}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
