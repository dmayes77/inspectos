import type { TenantSmtpConfig } from "@/lib/email/smtp-transport";

function parseBool(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return defaultValue;
}

export function getPlatformSmtpConfig(): TenantSmtpConfig | null {
  const host = process.env.APP_SMTP_HOST?.trim();
  const username = process.env.APP_SMTP_USERNAME?.trim();
  const password = process.env.APP_SMTP_PASSWORD?.trim();
  const fromEmail = process.env.APP_SMTP_FROM_EMAIL?.trim().toLowerCase();

  if (!host || !username || !password || !fromEmail) {
    return null;
  }

  const secure = parseBool(process.env.APP_SMTP_SECURE, true);
  const port = Number(process.env.APP_SMTP_PORT);

  return {
    host,
    port: Number.isFinite(port) ? Math.max(1, Math.min(65535, Math.floor(port))) : secure ? 465 : 587,
    secure,
    username,
    password,
    fromEmail,
    fromName: process.env.APP_SMTP_FROM_NAME?.trim() || null,
    replyTo: process.env.APP_SMTP_REPLY_TO?.trim().toLowerCase() || null,
  };
}
