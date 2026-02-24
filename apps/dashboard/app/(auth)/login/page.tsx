import { Suspense } from "react";
import { LoginPageClient } from "./login-page-client";

export default function LoginPage() {
  const publicSiteUrl = process.env.PUBLIC_SITE_URL ?? "/";

  return (
    <Suspense fallback={<div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">Loading...</div>}>
      <LoginPageClient publicSiteUrl={publicSiteUrl} />
    </Suspense>
  );
}
