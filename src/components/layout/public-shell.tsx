"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

interface PublicShellProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export function PublicShell({
  children,
  showHeader = true,
  showFooter = true,
}: PublicShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      {showHeader && (
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center justify-between">
            <Link href="/">
              <Logo size="md" />
            </Link>

            <nav className="hidden items-center gap-6 md:flex">
              <Link
                href="/features"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Pricing
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                About
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      {showFooter && (
        <footer className="border-t bg-card">
          <div className="container py-8">
            <div className="grid gap-8 md:grid-cols-4">
              <div className="space-y-4">
                <span className="text-lg font-bold">InspectOS</span>
                <p className="text-sm text-muted-foreground">
                  The all-in-one platform for home inspection businesses.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Product</h4>
                <nav className="flex flex-col gap-2">
                  <Link
                    href="/features"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Features
                  </Link>
                  <Link
                    href="/pricing"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/integrations"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Integrations
                  </Link>
                </nav>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Company</h4>
                <nav className="flex flex-col gap-2">
                  <Link
                    href="/about"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    About
                  </Link>
                  <Link
                    href="/contact"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Contact
                  </Link>
                  <Link
                    href="/blog"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Blog
                  </Link>
                </nav>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Legal</h4>
                <nav className="flex flex-col gap-2">
                  <Link
                    href="/privacy"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/terms"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Terms of Service
                  </Link>
                </nav>
              </div>
            </div>

            <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} InspectOS. All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
