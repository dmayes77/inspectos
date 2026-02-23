import { randomBytes } from "node:crypto";
import { badRequest, serverError, success } from "@/lib/supabase";
import { withAuth } from "@/lib/api/with-auth";
import { decryptTenantSecret } from "@/lib/security/tenant-secret";
import { sendSmtpTestEmail, type TenantSmtpConfig } from "@/lib/email/smtp-transport";
import { getPlatformSmtpConfig } from "@/lib/email/platform-smtp";

const DEFAULT_LINK_TTL_HOURS = 72;

type StoredSmtpSettings = {
  host?: string;
  port?: number;
  secure?: boolean;
  username?: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  passwordEncrypted?: string;
};

function resolveAgentPortalBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_AGENT_PORTAL_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl && appUrl.length > 0) {
    return appUrl.replace(/\/+$/, "");
  }

  return "http://localhost:3003";
}

function resolveTenantSmtpConfig(settings: { smtp?: StoredSmtpSettings }): TenantSmtpConfig | null {
  const smtp = settings.smtp;
  if (smtp?.host && smtp.username && smtp.fromEmail && smtp.passwordEncrypted) {
    return {
      host: smtp.host,
      port: typeof smtp.port === "number" ? smtp.port : (smtp.secure === false ? 587 : 465),
      secure: smtp.secure !== false,
      username: smtp.username,
      password: decryptTenantSecret(smtp.passwordEncrypted),
      fromEmail: smtp.fromEmail,
      fromName: smtp.fromName ?? null,
      replyTo: smtp.replyTo ?? null,
    };
  }
  return null;
}

/**
 * POST /api/admin/agents/[id]/send-portal-link
 */
export const POST = withAuth<{ id: string }>(async ({ supabase, serviceClient, tenant, params }) => {
  const { id } = params;
  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("id, name, email, status, portal_access_enabled")
    .eq("tenant_id", tenant.id)
    .eq("id", id)
    .maybeSingle();

  if (agentError || !agent) {
    return serverError("Agent not found", agentError);
  }

  if (!agent.email) {
    return badRequest("Agent needs an email before sending a portal link.");
  }

  if (!agent.portal_access_enabled) {
    return badRequest("Portal access is disabled for this agent.");
  }

  if (agent.status !== "active") {
    return badRequest("Only active agents can receive portal access links.");
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + DEFAULT_LINK_TTL_HOURS * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await supabase
    .from("agents")
    .update({
      magic_link_token: token,
      magic_link_expires_at: expiresAt,
    })
    .eq("tenant_id", tenant.id)
    .eq("id", id);

  if (updateError) {
    return serverError("Failed to generate portal link", updateError);
  }

  const portalBaseUrl = resolveAgentPortalBaseUrl();
  const link = `${portalBaseUrl}/login?token=${token}&agent=${id}`;

  const { data: tenantData, error: tenantError } = await serviceClient
    .from("tenants")
    .select("settings")
    .eq("id", tenant.id)
    .maybeSingle();

  if (tenantError) {
    return serverError("Failed to load SMTP settings", tenantError);
  }

  const tenantSettings = (tenantData?.settings ?? {}) as { smtp?: StoredSmtpSettings };
  const smtpConfig = resolveTenantSmtpConfig(tenantSettings) ?? getPlatformSmtpConfig();

  if (!smtpConfig) {
    return success({
      success: true,
      expires_at: expiresAt,
      link,
      email_sent: false,
      warning: "SMTP is not configured. Share the copied link manually or configure SMTP in Settings.",
    });
  }

  try {
    await sendSmtpTestEmail({
      config: smtpConfig,
      toEmail: agent.email,
      subject: `${tenant.name} invited you to the InspectOS Agent Portal`,
      text: [
        `Hi ${agent.name},`,
        "",
        `${tenant.name} granted you access to the InspectOS Agent Portal.`,
        "",
        `Sign in link: ${link}`,
        `This link expires on ${new Date(expiresAt).toLocaleString()}.`,
        "",
        "If you were not expecting this, you can ignore this email.",
      ].join("\n"),
    });
  } catch (smtpError) {
    const message = smtpError instanceof Error ? smtpError.message : "Failed to send email.";
    return success({
      success: true,
      expires_at: expiresAt,
      link,
      email_sent: false,
      warning: `Email failed: ${message}`,
    });
  }

  return success({
    success: true,
    expires_at: expiresAt,
    link,
    email_sent: true,
  });
});
