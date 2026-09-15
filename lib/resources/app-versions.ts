import "server-only";

import { apiFetch } from "@/lib/api-client";

export type AppPlatform = "android" | "ios";

/** Per-platform version policy for the field app — see backend `AppVersionController`. */
export interface AppVersion {
  platform: AppPlatform;
  latest_version: string;
  latest_build: number;
  min_supported_build: number;
  update_url: string | null;
  release_notes: string | null;
  updated_at: string | null;
}

export interface AppVersionInput {
  latest_version: string;
  latest_build: number;
  min_supported_build: number;
  update_url?: string | null;
  release_notes?: string | null;
}

export function listAppVersions(): Promise<AppVersion[]> {
  return apiFetch<AppVersion[]>("/admin/app-versions");
}

export function updateAppVersion(platform: AppPlatform, input: AppVersionInput): Promise<AppVersion> {
  return apiFetch<AppVersion>(`/admin/app-versions/${platform}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
