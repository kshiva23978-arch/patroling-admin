import "server-only";

import { apiFetch } from "@/lib/api-client";

/** An image/video for the field app's launch screen — see backend `HomeMediaController`. */
export interface HomeMedia {
  id: string;
  type: "image" | "video";
  title: string | null;
  mime: string;
  file_size: number;
  is_active: boolean;
  /** Public streaming URL on the backend (no auth — the app shows this before login). */
  url: string;
  created_at: string | null;
  updated_at: string | null;
}

export function listHomeMedia(): Promise<HomeMedia[]> {
  return apiFetch<HomeMedia[]>("/admin/home-media");
}

/** `form` carries `file`, optional `title`, optional `activate` ("1"). */
export function uploadHomeMedia(form: FormData): Promise<HomeMedia> {
  return apiFetch<HomeMedia>("/admin/home-media", { method: "POST", body: form });
}

export function setHomeMediaActive(id: string, active: boolean): Promise<HomeMedia> {
  return apiFetch<HomeMedia>(`/admin/home-media/${id}/activate`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}

export function deleteHomeMedia(id: string): Promise<void> {
  return apiFetch<void>(`/admin/home-media/${id}`, { method: "DELETE" });
}
