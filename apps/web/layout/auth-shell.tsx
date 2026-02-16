"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { BackButton } from "@/components/ui/back-button";

interface AuthShellProps {
  children: ReactNode;
  /** Show back to home button */
  showBackButton?: boolean;
  /** Title for the page */
  title?: string;
  /** Subtitle or description */
  subtitle?: string;
}

/**
 * AuthShell - Minimal shell for authentication pages
 *
 * Provides a clean, focused experience for:
 * - Login
 * - Registration
 * - Password reset
 * - Team invites
 *
 * Features:
 * - Centered layout
 * - Logo at top
 * - Back to home button
 * - Safe area handling
 * - Works in web and native app
 */
export function AuthShell({
  children,
  showBackButton = true,
  title,
  subtitle,
}: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background safe-area-inset-top safe-area-inset-bottom safe-area-inset-left safe-area-inset-right">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4">
        {showBackButton ? (
          <BackButton href="/" label="Back to Home" variant="ghost" size="sm" />
        ) : (
          <div aria-hidden="true" />
        )}

        <Link href="/">
          <Logo size="sm" />
        </Link>
      </header>

      {/* Main Content - Centered */}
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          {/* Title and Subtitle */}
          {(title || subtitle) && (
            <div className="text-center space-y-2">
              {title && (
                <h1 className="text-3xl font-semibold tracking-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-muted-foreground">{subtitle}</p>
              )}
            </div>
          )}

          {/* Auth Form/Content */}
          {children}
        </div>
      </main>

      {/* Footer - Minimal */}
      <footer className="px-4 py-6 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} InspectOS. All rights reserved.
        </p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <Link
            href="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-foreground transition-colors"
          >
            Terms
          </Link>
        </div>
      </footer>
    </div>
  );
}
