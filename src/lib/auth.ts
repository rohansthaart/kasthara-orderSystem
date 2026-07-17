import { cookies } from "next/headers";
import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

const accessCookie = "kasthara_access";
const refreshCookie = "kasthara_refresh";
const encoder = new TextEncoder();

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
};

export async function hashPassword(password: string) {
  return hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export async function signAccessToken(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(encoder.encode(requiredEnv("JWT_ACCESS_SECRET")));
}

export async function signRefreshToken(user: SessionUser, tokenVersion: number) {
  return new SignJWT({ ...user, tokenVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(encoder.encode(requiredEnv("JWT_REFRESH_SECRET")));
}

export async function setAuthCookies(user: SessionUser, refreshTokenVersion: number) {
  const cookieStore = await cookies();
  cookieStore.set(accessCookie, await signAccessToken(user), cookieOptions(15 * 60));
  cookieStore.set(refreshCookie, await signRefreshToken(user, refreshTokenVersion), cookieOptions(30 * 24 * 60 * 60));
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(accessCookie);
  cookieStore.delete(refreshCookie);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(accessCookie)?.value;
  if (!token) return null;
  try {
    const result = await jwtVerify(token, encoder.encode(requiredEnv("JWT_ACCESS_SECRET")));
    const payload = result.payload as SessionUser;
    if (!payload.id || !payload.email) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireRole(roles: Array<"ADMIN" | "STAFF">) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new Error("Forbidden");
  return user;
}

export async function refreshSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(refreshCookie)?.value;
  if (!token) throw new Error("Unauthorized");
  const result = await jwtVerify(token, encoder.encode(requiredEnv("JWT_REFRESH_SECRET")));
  const payload = result.payload as SessionUser & { tokenVersion?: number };
  const dbUser = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!dbUser || !dbUser.isActive || dbUser.refreshTokenVersion !== payload.tokenVersion) {
    throw new Error("Unauthorized");
  }
  const sessionUser: SessionUser = {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
  };
  await prisma.user.update({
    where: { id: dbUser.id },
    data: { refreshTokenVersion: { increment: 1 } },
  });
  await setAuthCookies(sessionUser, dbUser.refreshTokenVersion + 1);
  return sessionUser;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

function requiredEnv(key: string) {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is required`);
  return value;
}
