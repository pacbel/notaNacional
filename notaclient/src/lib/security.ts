import { randomBytes, createHash } from "crypto";

export function generateMfaCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000);
  return String(code);
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
