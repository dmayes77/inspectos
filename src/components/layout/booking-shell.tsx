"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

interface BookingShellProps {
  children: ReactNode;
  companyName: string;
  companyLogo?: string;
  currentStep?: number;
  totalSteps?: number;
}

export function BookingShell({
  children,
  companyName,
  companyLogo,
  currentStep,
  totalSteps = 3,
}: BookingShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={companyName}
                className="h-10 w-auto"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground">
                {companyName.charAt(0)}
              </div>
            )}
            <span className="text-lg font-semibold">{companyName}</span>
          </div>

          {currentStep && (
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
          )}
        </div>
      </header>

      {/* Progress Bar */}
      {currentStep && (
        <div className="h-1 bg-slate-200">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <div className="container py-8">{children}</div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6">
        <div className="container flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>Powered by</span>
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo size="sm" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
