import "server-only";

import { destroySession, getSessionToken } from "./session";

export interface Envelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PageMeta;
}

export interface PageMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface Paginated<T> {
  data: T[];
  meta?: PageMeta;
}

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string[]>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string) {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

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

/**
 * Every authenticated call to Laravel funnels through here. It attaches the
 * bearer token from the sealed session cookie, and normalizes the two error
 * shapes the backend can return: Laravel's default ValidationException body
 * ({message, errors}) and the API's own domain-error body ({success:false,
 * message, data:null}, e.g. duplicate beat name).
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<Envelope<T>> {
  const token = await getSessionToken();

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(backendUrl(path), {
    ...options,
    headers,
    cache: "no-store",
  });

  const json = await parseJson(res);

  if (!res.ok) {
    const body = (json ?? {}) as { message?: string; errors?: Record<string, string[]> };

    if (res.status === 401) {
      await destroySession();
      throw new UnauthorizedError(body.message ?? "Your session has expired. Please log in again.");
    }

    throw new ApiError(
      body.message ?? `Request failed with status ${res.status}.`,
      res.status,
      body.errors,
    );
  }

  return (json ?? { success: true, message: "", data: null }) as Envelope<T>;
}

/** For endpoints returning a single resource, unwraps the `data` field. */
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const envelope = await request<T>(path, options);
  return envelope.data;
}

/** For paginated `index` endpoints, keeps `data` + `meta` together. */
export async function apiFetchPaginated<T>(path: string, options?: RequestInit): Promise<Paginated<T>> {
  const envelope = await request<T[]>(path, options);
  return { data: envelope.data, meta: envelope.meta };
}

/**
 * Walks every page of a paginated index endpoint and concatenates the
 * results. Used to populate reference-data dropdowns (roles, designations,
 * ranges, patrolling modes) — the backend has no "all records" query param,
 * so this compensates client-side. Capped at 50 pages (750 records) as a
 * safety bound against unbounded loops.
 */
export async function apiFetchAll<T>(basePath: string): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  const MAX_PAGES = 50;

  while (page <= MAX_PAGES) {
    const separator = basePath.includes("?") ? "&" : "?";
    const { data, meta } = await apiFetchPaginated<T>(`${basePath}${separator}page=${page}`);
    all.push(...data);
    if (!meta || page >= meta.last_page) break;
    page += 1;
  }

  return all;
}

/**
 * GET /v1/user is the one endpoint that doesn't use the {success,message,data}
 * envelope — it returns the authenticated model as-is. Returns null if there
 * is no session or the token is no longer valid.
 */
export async function fetchRawUser<T>(): Promise<T | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const res = await fetch(backendUrl("/user"), {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 401) {
      await destroySession();
    }
    return null;
  }

  return (await parseJson(res)) as T;
}
