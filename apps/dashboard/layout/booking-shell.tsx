"use client";

import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
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
    <div className="flex h-dvh flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white safe-area-inset-top safe-area-inset-left safe-area-inset-right">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {companyLogo ? (
              <Image
                src={companyLogo}
                alt={companyName}
                width={40}
                height={40}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-lg font-bold text-primary-foreground">
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-16 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {currentStep && (
          <div className="h-1 bg-slate-200">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        )}
        <div className="w-full px-4 py-8">{children}</div>
      </main>

      {/* Footer */}
      <footer className="flex h-16 items-center justify-center border-t bg-white safe-area-inset-bottom safe-area-inset-left safe-area-inset-right">
        <div className="flex items-center justify-center gap-2 px-4 text-sm text-muted-foreground">
          <span>Powered by</span>
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <Logo size="sm" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
