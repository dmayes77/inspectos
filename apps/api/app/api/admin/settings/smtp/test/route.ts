import { badRequest, serverError, success } from "@/lib/supabase";
import { requirePermission, withAuth } from "@/lib/api/with-auth";
import { decryptTenantSecret } from "@/lib/security/tenant-secret";
import { sendSmtpTestEmail } from "@/lib/email/smtp-transport";
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

function sanitizeErrorMessage(message: string): string {
  return message.replace(/\s+/g, " ").slice(0, 280);
}

export const POST = withAuth(async ({ serviceClient, tenant, user, memberRole, memberPermissions, request }) => {
  const permissionCheck = requirePermission(
    memberRole,
    "edit_settings",
    "You do not have permission to test SMTP settings",
    memberPermissions
  );
  if (permissionCheck) return permissionCheck;

  const body = (await request.json().catch(() => ({}))) as { toEmail?: string };
  const recipientEmail = typeof body.toEmail === "string" && body.toEmail.trim()
    ? body.toEmail.trim().toLowerCase()
    : (user.email ?? "").trim().toLowerCase();

  if (!recipientEmail) {
    return badRequest("Recipient email is required for SMTP test.");
  }

  const { data, error } = await serviceClient
    .from("tenants")
    .select("settings")
    .eq("id", tenant.id)
    .maybeSingle();

  if (error) {
    return serverError("Failed to load SMTP settings", error);
  }

  const settings = (data?.settings ?? {}) as { smtp?: StoredSmtpSettings };
  const smtp = settings.smtp ?? {};

  const testTimestamp = new Date().toISOString();
  try {
    let resolvedConfig;
    let configSource: "tenant" | "platform" = "tenant";

    if (smtp.host && smtp.username && smtp.fromEmail && smtp.passwordEncrypted) {
      const password = decryptTenantSecret(smtp.passwordEncrypted);
      resolvedConfig = {
        host: smtp.host,
        port: typeof smtp.port === "number" ? smtp.port : (smtp.secure === false ? 587 : 465),
        secure: smtp.secure !== false,
        username: smtp.username,
        password,
        fromEmail: smtp.fromEmail,
        fromName: smtp.fromName ?? null,
        replyTo: smtp.replyTo ?? null,
      };
    } else {
      resolvedConfig = getPlatformSmtpConfig();
      configSource = "platform";
    }

    if (!resolvedConfig) {
      return badRequest(
        "SMTP settings are incomplete. Save tenant SMTP credentials or configure APP_SMTP_* platform defaults."
      );
    }

    await sendSmtpTestEmail({
      config: resolvedConfig,
      toEmail: recipientEmail,
      subject: `InspectOS SMTP test (${tenant.name}, ${configSource})`,
      text: `This is a test email from InspectOS for business "${tenant.name}".`,
    });

    const updatedSettings = {
      ...settings,
      smtp: {
        ...smtp,
        lastTestAt: testTimestamp,
        lastTestStatus: "ok",
        lastTestError: null,
      },
    };
    await serviceClient.from("tenants").update({ settings: updatedSettings }).eq("id", tenant.id);

    return success({ message: "SMTP test email sent successfully.", testedAt: testTimestamp });
  } catch (smtpError) {
    const message = sanitizeErrorMessage(
      smtpError instanceof Error ? smtpError.message : "SMTP test failed."
    );

    const updatedSettings = {
      ...settings,
      smtp: {
        ...smtp,
        lastTestAt: testTimestamp,
        lastTestStatus: "failed",
        lastTestError: message,
      },
    };
    await serviceClient.from("tenants").update({ settings: updatedSettings }).eq("id", tenant.id);

    return serverError("SMTP test failed", message);
  }
});
