import { createHash, randomBytes } from "node:crypto";

/** Opaque value sent once in the email link (never persisted). */
export function generatePasswordResetRawToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Store this in `PasswordResetToken.token` (unique lookup). */
export function hashPasswordResetToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}
