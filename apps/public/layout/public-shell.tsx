"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicShellProps {
  children: ReactNode;
  /** Show header navigation */
  showHeader?: boolean;
  /** Show footer */
  showFooter?: boolean;
  /** Use full width (no container) for content - useful for landing pages */
  fullWidth?: boolean;
  /** Add padding to content area */
  padContent?: boolean;
  /** Custom className for main content area */
  contentClassName?: string;
}

const navigationLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
];

const appBaseUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL || "";
const signInHref = appBaseUrl ? `${appBaseUrl}/login` : "/login";
const registerHref = appBaseUrl ? `${appBaseUrl}/register` : "/register";

/**
 * PublicShell - Website-like layout for all public routes
 *
 * Provides a traditional website experience with:
 * - Sticky header with navigation
 * - Mobile-responsive menu
 * - Footer with links
 * - Natural webpage scrolling
 * - Safe area handling for notches/home indicators
 * - Works seamlessly in web browsers and Capacitor native app
 *
 * Usage:
 * ```tsx
 * <PublicShell>
 *   <YourContent />
 * </PublicShell>
 * ```
 */
export function PublicShell({
  children,
  showHeader = true,
  showFooter = true,
  fullWidth = false,
  padContent = false,
  contentClassName,
}: PublicShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      {showHeader && (
        <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-lg safe-area-inset-top safe-area-inset-left safe-area-inset-right">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
            {/* Logo */}
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <Logo size="md" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-6 md:flex">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden items-center gap-3 md:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link href={signInHref}>Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={registerHref}>Get Started</Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Mobile Navigation Menu */}
          <div
            className={cn(
              "absolute left-0 right-0 top-full z-50 overflow-hidden border-b bg-background/95 backdrop-blur transition-all duration-500 ease-out md:hidden",
              mobileMenuOpen
                ? "max-h-96 opacity-100 translate-y-0"
                : "max-h-0 opacity-0 -translate-y-1 pointer-events-none"
            )}
          >
              <div className="mx-auto max-w-6xl space-y-3 px-4 py-4 md:px-6">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 pt-4 border-t">
                  <Button variant="ghost" size="sm" asChild className="justify-start">
                    <Link href={signInHref} onClick={() => setMobileMenuOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                  <Button size="sm" asChild className="justify-start">
                    <Link href={registerHref} onClick={() => setMobileMenuOpen(false)}>
                      Get Started
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
        </header>
      )}

      {/* Main Content - Natural webpage scrolling */}
      <main
        className={cn(
          "flex-1",
          !fullWidth && "mx-auto w-full max-w-6xl px-4 md:px-6",
          padContent && "py-8",
          contentClassName
        )}
      >
        {children}
      </main>

      {/* Footer */}
      {showFooter && (
        <footer className="border-t bg-card safe-area-inset-bottom safe-area-inset-left safe-area-inset-right">
          <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
            <div className="grid gap-8 md:grid-cols-4">
              {/* Brand */}
              <div className="space-y-4">
                <Link href="/" className="flex items-center gap-2">
                  <Logo size="md" />
                </Link>
                <p className="text-sm text-muted-foreground">
                  The operating system for running an inspection business.
                </p>
              </div>

              {/* Product Links */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Product</h4>
                <nav className="flex flex-col gap-2">
                  <Link
                    href="/features"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Features
                  </Link>
                  <Link
                    href="/pricing"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/integrations"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Integrations
                  </Link>
                </nav>
              </div>

              {/* Company Links */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Company</h4>
                <nav className="flex flex-col gap-2">
                  <Link
                    href="/about"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    About
                  </Link>
                  <Link
                    href="/contact"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Contact
                  </Link>
                  <Link
                    href="/blog"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Blog
                  </Link>
                </nav>
              </div>

              {/* Legal Links */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Legal</h4>
                <nav className="flex flex-col gap-2">
                  <Link
                    href="/privacy"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/terms"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </Link>
                  <Link
                    href="/data-charter"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Data Charter
                  </Link>
                </nav>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
              <p>&copy; {new Date().getFullYear()} InspectOS. All rights reserved.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
