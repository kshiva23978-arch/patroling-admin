"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { cardClass, inputClass, labelClass, primaryButtonClass } from "@/lib/ui-classes";
import { appVersionSchema, type AppVersionFormInput } from "@/lib/schemas/app-versions";
import type { AppVersion } from "@/lib/resources/app-versions";
import { updateAppVersionAction } from "./actions";

const PLATFORM_LABEL = { android: "Android", ios: "iOS" } as const;

export function AppVersionForm({ version }: { version: AppVersion }) {
  const [isPending, startTransition] = useTransition();
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<AppVersionFormInput>({
    resolver: zodResolver(appVersionSchema),
    defaultValues: {
      latest_version: version.latest_version,
      latest_build: version.latest_build,
      min_supported_build: version.min_supported_build,
      update_url: version.update_url ?? "",
      release_notes: version.release_notes ?? "",
    },
  });

  const minBuild = useWatch({ control, name: "min_supported_build" });

  const onSubmit = handleSubmit((values) => {
    setRootError(null);
    startTransition(async () => {
      const result = await updateAppVersionAction(version.platform, values);
      if (result.success) {
        toast.success(`${PLATFORM_LABEL[version.platform]} version policy saved.`);
        return;
      }
      setRootError(result.message);
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        setError(field as keyof AppVersionFormInput, { message: messages[0] });
      }
    });
  });

  return (
    <form onSubmit={onSubmit} className={`space-y-4 p-5 ${cardClass}`}>
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold text-zinc-900">{PLATFORM_LABEL[version.platform]}</h2>
        {version.updated_at && (
          <span className="text-xs text-zinc-500">
            Last changed {new Date(version.updated_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </span>
        )}
      </div>

      {rootError && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{rootError}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Latest version" error={errors.latest_version?.message}>
          <input type="text" placeholder="1.0.0" className={inputClass} {...register("latest_version")} />
        </Field>
        <Field label="Latest build" error={errors.latest_build?.message}>
          <input type="number" min={1} className={inputClass} {...register("latest_build", { valueAsNumber: true })} />
        </Field>
        <Field label="Minimum supported build" error={errors.min_supported_build?.message}>
          <input type="number" min={1} className={inputClass} {...register("min_supported_build", { valueAsNumber: true })} />
        </Field>
      </div>

      <Field label="Update URL" error={errors.update_url?.message} hint="Where the Update button sends rangers — the store listing, or a direct APK link.">
        <input type="url" placeholder="https://play.google.com/store/apps/details?id=…" className={inputClass} {...register("update_url")} />
      </Field>

      <Field label="Release notes" error={errors.release_notes?.message} hint="Shown in the update prompt. Optional.">
        <textarea rows={3} className={inputClass} {...register("release_notes")} />
      </Field>

      {minBuild > version.min_supported_build && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Raising the minimum supported build to {minBuild} will lock every device on an older build to a mandatory-update
          screen the next time it opens online. Unsynced data on those devices stays on the device until they update.
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className={primaryButtonClass}>
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className={labelClass}>{label}</label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}
