import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

export const SESSION_COOKIE_NAME = "projelys_session";
const SESSION_DURATION_DAYS = 7;

export type AuthUser = {
  id: number;
  email: string;
  name: string | null;
  role: "ADMIN" | "FULL" | "LIMITED";
};

function hashPassword(password: string, salt?: string) {
  const usedSalt = salt ?? randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, usedSalt, 64).toString("hex");
  return `${usedSalt}:${derivedKey}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;

  const hashedBuffer = Buffer.from(key, "hex");
  const suppliedBuffer = Buffer.from(
    scryptSync(password, salt, 64).toString("hex"),
    "hex"
  );

  if (hashedBuffer.length !== suppliedBuffer.length) return false;

  return timingSafeEqual(hashedBuffer, suppliedBuffer);
}

function generateSessionToken() {
  return randomBytes(32).toString("hex");
}

export async function createPasswordHash(password: string) {
  return hashPassword(password);
}

export async function ensureAdminUser() {
  const email = String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD ?? "");
  const name = String(process.env.ADMIN_NAME ?? "Administrateur").trim();

  if (!email || !password) return;

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  const passwordHash = await createPasswordHash(password);

  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
    });
    return;
  }

  if (existing.role !== "ADMIN" || !existing.isActive) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: "ADMIN",
        isActive: true,
      },
    });
  }
}

export async function loginWithCredentials(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();

  await ensureAdminUser();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.isActive) return null;

  const isValid = verifyPassword(password, user.passwordHash);
  if (!isValid) return null;

  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.session.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  return {
    token,
    expiresAt,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as AuthUser["role"],
    } satisfies AuthUser,
  };
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return;

  await prisma.session.deleteMany({
    where: { token },
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.deleteMany({
      where: { token },
    });
    return null;
  }

  if (!session.user.isActive) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as AuthUser["role"],
  } satisfies AuthUser;
}

export async function requireUser() {
  return getCurrentUser();
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}