import Link from "next/link";
import "./globals.css";

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <main className="flex min-h-screen items-center justify-center p-4">
          <section className="w-full max-w-md rounded-2xl border bg-card/90 p-8 text-center shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">404</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The page you requested does not exist or has been moved.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <Link
                href="/"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold text-foreground transition hover:bg-accent"
              >
                Go to Login
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
