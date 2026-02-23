# SMTP Setup (Platform + Tenant)

## 1) Platform SMTP for auth emails (confirmation, reset)

Auth emails are sent by Supabase Auth, so configure SMTP in **Supabase**, not Vercel:

1. Supabase Dashboard -> Authentication -> Settings -> SMTP Settings
2. Enable custom SMTP and enter your provider credentials.
3. Set sender email/domain (example: `no-reply@inspectos.co`).
4. Save and send a test email from Supabase.

### Required domain/DNS

In your DNS provider for `inspectos.co`:

- Add SPF record required by your SMTP provider.
- Add DKIM records required by your SMTP provider.
- Add DMARC record (recommended).

## 2) Redirect URLs for Vercel domains

Because your platform domain is on Vercel, keep these aligned:

### Supabase Auth URL settings

Supabase Dashboard -> Authentication -> URL Configuration:

- **Site URL (prod):** `https://inspectos.co`
- **Additional Redirect URLs:**
  - `https://inspectos.co/welcome`
  - `https://dev.inspectos.co/welcome`
  - `http://localhost:3000/welcome`

### Vercel env (Web project)

Set in Vercel for each environment:

- **Production:** `NEXT_PUBLIC_WEB_URL=https://inspectos.co`
- **Preview/Dev:** `NEXT_PUBLIC_WEB_URL=https://dev.inspectos.co`

The register flow uses `NEXT_PUBLIC_WEB_URL` for `emailRedirectTo`.

## 3) Platform SMTP env for app-side mail fallback (server)

If you send app-managed email from the API, set these in the **API Vercel project**:

- `APP_SMTP_HOST`
- `APP_SMTP_PORT`
- `APP_SMTP_SECURE` (`true` or `false`)
- `APP_SMTP_USERNAME`
- `APP_SMTP_PASSWORD`
- `APP_SMTP_FROM_EMAIL`
- `APP_SMTP_FROM_NAME` (optional)
- `APP_SMTP_REPLY_TO` (optional)

## 4) Tenant (business) SMTP overrides

Per-business SMTP is configured in-app at:

- `Settings -> Integrations -> SMTP`

What is stored for each tenant:

- Host/port/secure
- Username
- From email/name
- Reply-to
- Encrypted password (encrypted server-side before storage)

Use **Send test email** from that screen to validate tenant config.

## 5) Encryption key for tenant SMTP passwords

In API env (local + Vercel), set one stable key:

- `TENANT_SMTP_ENCRYPTION_KEY=<long-random-secret>`

If this changes, previously stored tenant SMTP passwords cannot be decrypted.
