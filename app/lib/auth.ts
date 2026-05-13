import "server-only";

import crypto from "crypto";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export type SessionRole = "ADMIN" | "FULL" | "LIMITED";

export type SessionUser = {
  id: number;
  email: string;
  name: string | null;
  role: SessionRole;
};

type SessionPayload = {
  user: SessionUser;
  exp: number;
};

const COOKIE_NAME = "projelys_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Missing AUTH_SECRET or NEXTAUTH_SECRET");
  }
  return secret;
}

function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad ? normalized + "=".repeat(4 - pad) : normalized;
  return Buffer.from(padded, "base64").toString("utf8");
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSignedSession(user: SessionUser) {
  const payload: SessionPayload = {
    user,
    exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifySignedSession(
  token: string | undefined | null,
): SessionUser | null {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;

    if (!payload?.user || !payload?.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload.user;
  } catch {
    return null;
  }
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifySignedSession(token);
}

export async function getCurrentUser() {
  return getSessionUser();
}

export async function setSessionCookie(user: SessionUser) {
  const cookieStore = await cookies();
  const token = createSignedSession(user);

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return user;
}

export const sessionCookieName = COOKIE_NAME;

export function createPasswordHash(password: string) {
  if (!password || password.length < 8) {
    throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${derivedKey}`;
}

export function verifyPasswordHash(
  password: string,
  storedHash: string | null | undefined,
) {
  if (!password || !storedHash) return false;

  const [salt, originalKey] = storedHash.split(":");
  if (!salt || !originalKey) return false;

  const derivedKey = crypto.scryptSync(password, salt, 64);
  const originalBuffer = Buffer.from(originalKey, "hex");

  if (derivedKey.length !== originalBuffer.length) return false;

  return crypto.timingSafeEqual(derivedKey, originalBuffer);
}