export type UserRole = "USER" | "ADMIN";

export type CurrentUser = {
  id: string;
  email: string;
  role: UserRole;
};

export function isAdmin(user: CurrentUser | null | undefined): boolean {
  return Boolean(user && user.role === "ADMIN");
}

export function canBypassPromptValidation(user: CurrentUser | null | undefined): boolean {
  return isAdmin(user);
}

export function canManagePrompt(user: CurrentUser | null | undefined, ownerUserId: string): boolean {
  if (!user) return false;
  return user.role === "ADMIN" || user.id === ownerUserId;
}

export function forbidIfNot(condition: boolean, message = "Forbidden") {
  if (!condition) {
    const err = new Error(message);
    (err as { status?: number }).status = 403;
    throw err;
  }
}

