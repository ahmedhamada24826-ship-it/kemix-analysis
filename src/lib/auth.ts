import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const configuredJwtSecret = process.env.JWT_SECRET;
if (process.env.NODE_ENV === "production" && (!configuredJwtSecret || configuredJwtSecret.length < 32)) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters in production.");
}
// Keep local development usable without ever shipping a known, shared fallback secret.
const JWT_SECRET = configuredJwtSecret || randomBytes(48).toString("hex");
const COOKIE_NAME = "kemix_session_token";

export type Role =
  | "SUPER_ADMIN"
  | "OPERATIONS_MANAGER"
  | "PROJECT_LEAD"
  | "ANALYST"
  | "TRAINEE"
  | "SUPPORT_AGENT"
  | "CLIENT";

export const STAFF_ROLES: Role[] = [
  "SUPER_ADMIN",
  "OPERATIONS_MANAGER",
  "PROJECT_LEAD",
  "ANALYST",
  "TRAINEE",
  "SUPPORT_AGENT",
];

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyName: string | null;
  clientType: string;
  departmentId?: string | null;
  isDepartmentLead?: boolean;
  authVersion?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: SessionUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    // Optional verification that user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, companyName: true, clientType: true, departmentId: true, status: true, authVersion: true, department: { select: { leadUserId: true } } },
    });

    if (!user || user.status !== "ACTIVE" || (decoded.authVersion ?? 0) !== user.authVersion) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      companyName: user.companyName,
      clientType: user.clientType,
      departmentId: user.departmentId,
      isDepartmentLead: user.department?.leadUserId === user.id,
      authVersion: user.authVersion,
    };
  } catch {
    return null;
  }
}

export function isStaffRole(role: string): boolean {
  return STAFF_ROLES.includes(role as Role);
}

export function checkPermission(userRole: Role, allowedRoles: Role[]): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  return allowedRoles.includes(userRole);
}
