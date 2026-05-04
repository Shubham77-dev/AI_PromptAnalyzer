export function validatePasswordStrength(password: string): { ok: true } | { ok: false; error: string } {
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (password.length > 256) {
    return { ok: false, error: "Password is too long." };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { ok: false, error: "Password must include at least one letter." };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, error: "Password must include at least one number." };
  }
  return { ok: true };
}
