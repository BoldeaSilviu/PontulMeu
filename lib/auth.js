import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { findUserById } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "development_only_change_in_production";
const COOKIE_NAME = "pontul_meu_auth";
const EXPIRES_IN = "30d"; // Token valid 30 days

/**
 * Hash password
 */
export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 10);
}

/**
 * Verify password
 */
export async function verifyPassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

/**
 * Create JWT token for user
 */
export function createToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: EXPIRES_IN });
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Set auth cookie in response
 */
export function setAuthCookie(token) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Clear auth cookie (logout)
 */
export function clearAuthCookie() {
  cookies().delete(COOKIE_NAME);
}

/**
 * Get current logged-in user from cookie
 */
export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload?.userId) return null;

  try {
    const user = await findUserById(payload.userId);
    if (!user) return null;

    // Don't leak password hash
    const { password_hash, ...safeUser } = user;
    return safeUser;
  } catch {
    return null;
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate password strength (min 8 chars)
 */
export function isValidPassword(password) {
  return typeof password === "string" && password.length >= 8;
}
