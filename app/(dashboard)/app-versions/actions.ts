"use server";

import { revalidatePath } from "next/cache";
import { toActionResult, type ActionResult } from "@/lib/action-result";
import { appVersionSchema, type AppVersionFormInput } from "@/lib/schemas/app-versions";
import { updateAppVersion, type AppPlatform } from "@/lib/resources/app-versions";
import { deleteHomeMedia, setHomeMediaActive, uploadHomeMedia } from "@/lib/resources/home-media";

export async function updateAppVersionAction(platform: AppPlatform, input: AppVersionFormInput): Promise<ActionResult> {
  const parsed = appVersionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Please check your input.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await updateAppVersion(platform, {
      ...parsed.data,
      update_url: parsed.data.update_url || null,
      release_notes: parsed.data.release_notes || null,
    });
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/app-versions");
  return { success: true };
}

/** 1 MB for everything — the app downloads this before login on mobile data, and Vercel 413s bodies over ~4.5 MB anyway. */
const MAX_IMAGE_BYTES = 1 * 1024 * 1024;
const MAX_VIDEO_BYTES = 1 * 1024 * 1024;
/** Mirrors the backend's allow-list — the server re-checks extension *and* content, this is just fast feedback. */
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "mp4", "webm"];

/** Receives the upload form directly (file + title + activate) — files can't cross the Server Action boundary any other way. */
export async function uploadHomeMediaAction(form: FormData): Promise<ActionResult> {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Choose an image or video to upload.", fieldErrors: { file: ["Choose a file."] } };
  }
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return { success: false, message: "Only JPG, PNG, WebP images or MP4/WebM videos are allowed.", fieldErrors: { file: ["Unsupported file type."] } };
  }
  const isVideo = extension === "mp4" || extension === "webm";
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    return { success: false, message: "Videos must be 1 MB or smaller." };
  }
  if (!isVideo && file.size > MAX_IMAGE_BYTES) {
    return { success: false, message: "Images must be 1 MB or smaller." };
  }

  const payload = new FormData();
  payload.append("file", file, file.name);
  const title = String(form.get("title") ?? "").trim();
  if (title) payload.append("title", title);
  if (form.get("activate") === "1") payload.append("activate", "1");

  try {
    await uploadHomeMedia(payload);
  } catch (err) {
    return toActionResult(err);
  }

  revalidatePath("/app-versions");
  return { success: true };
}

export async function setHomeMediaActiveAction(id: string, active: boolean): Promise<ActionResult> {
  try {
    await setHomeMediaActive(id, active);
  } catch (err) {
    return toActionResult(err);
  }
  revalidatePath("/app-versions");
  return { success: true };
}

export async function deleteHomeMediaAction(id: string): Promise<ActionResult> {
  try {
    await deleteHomeMedia(id);
  } catch (err) {
    return toActionResult(err);
  }
  revalidatePath("/app-versions");
  return { success: true };
}
