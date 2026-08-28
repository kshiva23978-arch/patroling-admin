import "server-only";

import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

/**
 * A separate, parallel session to `lib/session.ts` — an NGO/organization
 * account has no admin-table login at all (see `AuthController`'s "an
 * admin account cannot log into the app and vice versa" split); this
 * reuses their existing app (`/app/login`) credentials to give them a
 * read-only "My Activities" view in the admin panel, without touching the
 * real admin session cookie or its auth flow. A different cookie name
 * (`ngo_session`) keeps the two completely independent — a browser could
 * even hold both at once without conflict.
 */
export interface NgoSessionData {
  token?: string;
  employeeId?: string;
  name?: string;
}

const TTL_SECONDS = 60 * 60 * 8;

const sessionOptions: SessionOptions = {
  cookieName: "ngo_session",
  password: requireSessionSecret(),
  ttl: TTL_SECONDS,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

function requireSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set to a random string of at least 32 characters (see admin/.env.local).",
    );
  }
  return secret;
}

async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<NgoSessionData>(cookieStore, sessionOptions);
}

export async function createNgoSession(token: string, employeeId: string, name?: string | null) {
  const session = await getSession();
  session.token = token;
  session.employeeId = employeeId;
  session.name = name ?? undefined;
  await session.save();
}

export async function getNgoSessionToken(): Promise<string | null> {
  const session = await getSession();
  return session.token ?? null;
}

export async function getNgoSessionIdentity(): Promise<{ employeeId: string; name?: string } | null> {
  const session = await getSession();
  if (!session.token || !session.employeeId) return null;
  return { employeeId: session.employeeId, name: session.name };
}

export async function destroyNgoSession() {
  const session = await getSession();
  session.destroy();
}
