import { FALLBACK_ADMIN_EMAILS } from "./admin-emails.ts";

export function adminEmails(): Set<string> {
  return new Set(
    [...FALLBACK_ADMIN_EMAILS, ...(process.env.ADMIN_EMAILS ?? "").split(",")]
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | undefined): boolean {
  return Boolean(email && adminEmails().has(email.trim().toLowerCase()));
}
