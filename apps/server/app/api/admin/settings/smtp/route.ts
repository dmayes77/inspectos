import { badRequest, serverError, success } from "@/lib/supabase";
import { requirePermission, withAuth } from "@/lib/api/with-auth";
import { encryptTenantSecret } from "@/lib/security/tenant-secret";
import { getPlatformSmtpConfig } from "@/lib/email/platform-smtp";

type StoredSmtpSettings = {
  host?: string;
  port?: number;
  secure?: boolean;
  username?: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  passwordEncrypted?: string;
  configured?: boolean;
  lastTestAt?: string | null;
  lastTestStatus?: "ok" | "failed" | null;
  lastTestError?: string | null;
};

type PublicSmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  hasPassword: boolean;
  configured: boolean;
  lastTestAt: string | null;
  lastTestStatus: "ok" | "failed" | null;
  lastTestError: string | null;
};

function getDefaultSmtpSettings(): PublicSmtpSettings {
  return {
    host: "",
    port: 465,
    secure: true,
    username: "",
    fromEmail: "",
    fromName: "",
    replyTo: "",
    hasPassword: false,
    configured: false,
    lastTestAt: null,
    lastTestStatus: null,
    lastTestError: null,
  };
}

function toPublicSmtpSettings(stored: StoredSmtpSettings | undefined): PublicSmtpSettings {
  const defaults = getDefaultSmtpSettings();
  const settings = stored ?? {};
  return {
    host: typeof settings.host === "string" ? settings.host : defaults.host,
    port: typeof settings.port === "number" ? settings.port : defaults.port,
    secure: typeof settings.secure === "boolean" ? settings.secure : defaults.secure,
    username: typeof settings.username === "string" ? settings.username : defaults.username,
    fromEmail: typeof settings.fromEmail === "string" ? settings.fromEmail : defaults.fromEmail,
    fromName: typeof settings.fromName === "string" ? settings.fromName : defaults.fromName,
    replyTo: typeof settings.replyTo === "string" ? settings.replyTo : defaults.replyTo,
    hasPassword: typeof settings.passwordEncrypted === "string" && settings.passwordEncrypted.length > 0,
    configured: settings.configured === true,
    lastTestAt: typeof settings.lastTestAt === "string" ? settings.lastTestAt : null,
    lastTestStatus:
      settings.lastTestStatus === "ok" || settings.lastTestStatus === "failed"
        ? settings.lastTestStatus
        : null,
    lastTestError: typeof settings.lastTestError === "string" ? settings.lastTestError : null,
  };
}

function normalizeHost(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizePort(value: unknown, secure: boolean): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return secure ? 465 : 587;
  return Math.max(1, Math.min(65535, Math.floor(parsed)));
}

export const GET = withAuth(async ({ serviceClient, tenant, memberRole, memberPermissions }) => {
  const permissionCheck = requirePermission(
    memberRole,
    "view_settings",
    "You do not have permission to view SMTP settings",
    memberPermissions
  );
  if (permissionCheck) return permissionCheck;

  const { data, error } = await serviceClient
    .from("tenants")
    .select("settings")
    .eq("id", tenant.id)
    .maybeSingle();

  if (error) {
    return serverError("Failed to fetch SMTP settings", error);
  }

  const settings = (data?.settings ?? {}) as { smtp?: StoredSmtpSettings };
  return success({
    smtp: toPublicSmtpSettings(settings.smtp),
    platformConfigured: Boolean(getPlatformSmtpConfig()),
  });
});

export const PUT = withAuth(async ({ serviceClient, tenant, memberRole, memberPermissions, request }) => {
  const permissionCheck = requirePermission(
    memberRole,
    "edit_settings",
    "You do not have permission to update SMTP settings",
    memberPermissions
  );
  if (permissionCheck) return permissionCheck;

  const body = (await request.json()) as {
    host?: string;
    port?: number;
    secure?: boolean;
    username?: string;
    password?: string;
    clearPassword?: boolean;
    fromEmail?: string;
    fromName?: string;
    replyTo?: string;
  };

  const secure = body.secure !== false;
  const host = normalizeHost(body.host);
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const fromEmail = normalizeEmail(body.fromEmail);
  const fromName = typeof body.fromName === "string" ? body.fromName.trim() : "";
  const replyTo = normalizeEmail(body.replyTo);
  const port = normalizePort(body.port, secure);

  if (!host) return badRequest("SMTP host is required.");
  if (!fromEmail) return badRequest("From email is required.");
  if (!username) return badRequest("SMTP username is required.");

  const { data: currentData, error: currentError } = await serviceClient
    .from("tenants")
    .select("settings")
    .eq("id", tenant.id)
    .maybeSingle();

  if (currentError) {
    return serverError("Failed to load existing SMTP settings", currentError);
  }

  const currentSettings = (currentData?.settings ?? {}) as { smtp?: StoredSmtpSettings };
  const currentSmtp = currentSettings.smtp ?? {};

  const shouldClearPassword = body.clearPassword === true;
  let passwordEncrypted = currentSmtp.passwordEncrypted;

  if (shouldClearPassword) {
    passwordEncrypted = undefined;
  } else if (typeof body.password === "string" && body.password.trim()) {
    passwordEncrypted = encryptTenantSecret(body.password.trim());
  }

  const configured = Boolean(host && username && fromEmail && passwordEncrypted);
  const updatedSmtp: StoredSmtpSettings = {
    ...currentSmtp,
    host,
    port,
    secure,
    username,
    fromEmail,
    fromName,
    replyTo,
    passwordEncrypted,
    configured,
  };

  const newSettings = {
    ...currentSettings,
    smtp: updatedSmtp,
  };

  const { error: updateError } = await serviceClient
    .from("tenants")
    .update({ settings: newSettings })
    .eq("id", tenant.id);

  if (updateError) {
    return serverError("Failed to update SMTP settings", updateError);
  }

  return success({ smtp: toPublicSmtpSettings(updatedSmtp) });
});
