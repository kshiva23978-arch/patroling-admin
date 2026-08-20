import "server-only";

import { cookies } from "next/headers";
import { getIronSession, type SessionOptions } from "iron-session";

export interface SessionData {
  token?: string;
  employeeId?: string;
}

const TTL_SECONDS = 60 * 60 * 8; // 8 hours — matches the admin token TTL issued by the backend.

const sessionOptions: SessionOptions = {
  cookieName: "admin_session",
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
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function createSession(token: string, employeeId: string) {
  const session = await getSession();
  session.token = token;
  session.employeeId = employeeId;
  await session.save();
}

export async function getSessionToken(): Promise<string | null> {
  const session = await getSession();
  return session.token ?? null;
}

export async function getSessionEmployeeId(): Promise<string | null> {
  const session = await getSession();
  return session.employeeId ?? null;
}

export async function destroySession() {
  const session = await getSession();
  session.destroy();
}
