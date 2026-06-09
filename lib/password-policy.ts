export function isValidPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

export function validatePasswordStrength(password: string): { ok: true } | { ok: false; error: string } {
  if (password.length < 8) {
    return {
      ok: false,
      error: "Password must be at least 8 characters with 1 uppercase letter and 1 number.",
    };
  }
  if (password.length > 256) {
    return { ok: false, error: "Password is too long." };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      ok: false,
      error: "Password must be at least 8 characters with 1 uppercase letter and 1 number.",
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      ok: false,
      error: "Password must be at least 8 characters with 1 uppercase letter and 1 number.",
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      ok: false,
      error: "Password must be at least 8 characters with 1 uppercase letter and 1 number.",
    };
  }
  return { ok: true };
}

export type PasswordStrengthTier = "none" | "weak" | "fair" | "strong";

export function passwordStrengthTier(password: string): PasswordStrengthTier {
  if (password.length === 0) return "none";
  if (password.length < 8 || !/[A-Z]/.test(password)) return "weak";
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  if (password.length >= 8 && hasUpper && hasNumber && hasSymbol) return "strong";
  if (password.length >= 8 && (hasNumber || hasUpper)) return "fair";
  return "weak";
}
