import "server-only";

import { destroyNgoSession, getNgoSessionToken } from "./ngo-session";
import { ApiError, UnauthorizedError, type Envelope, type Paginated } from "./api-client";

/**
 * Same request plumbing as `lib/api-client.ts`, but authenticated with the
 * NGO session's app token and pointed at `/app/*` endpoints instead of
 * `/admin/*` — see `lib/ngo-session.ts` for why this is a separate,
 * parallel client rather than reusing `apiFetch` directly (that one only
 * ever reads the admin session cookie).
 */
function backendUrl(path: string): string {
  const base = process.env.BACKEND_API_URL;
  if (!base) {
    throw new Error("BACKEND_API_URL is not set (see admin/.env.local).");
  }
  return `${base.replace(/\/$/, "")}${path}`;
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function ngoRequest<T>(path: string, options: RequestInit = {}): Promise<Envelope<T>> {
  const token = await getNgoSessionToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(backendUrl(path), { ...options, headers, cache: "no-store" });
  const json = await parseJson(res);

  if (!res.ok) {
    const body = (json ?? {}) as { message?: string; errors?: Record<string, string[]> };

    if (res.status === 401) {
      await destroyNgoSession();
      throw new UnauthorizedError(body.message ?? "Your session has expired. Please log in again.");
    }

    throw new ApiError(body.message ?? `Request failed with status ${res.status}.`, res.status, body.errors);
  }

  return (json ?? { success: true, message: "", data: null }) as Envelope<T>;
}

export async function ngoFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const envelope = await ngoRequest<T>(path, options);
  return envelope.data;
}

export async function ngoFetchPaginated<T>(path: string, options?: RequestInit): Promise<Paginated<T>> {
  const envelope = await ngoRequest<T[]>(path, options);
  return { data: envelope.data, meta: envelope.meta };
}
