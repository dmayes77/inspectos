import { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

function GridShape() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-20"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    />
  );
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900">
      <div className="relative flex w-full min-h-screen flex-col lg:flex-row">
        {/* Left — form content (provided by page) */}
        <div className="flex flex-1 flex-col lg:w-1/2">{children}</div>

        {/* Right — branding panel */}
        <div className="hidden lg:flex lg:w-1/2 min-h-screen items-center justify-center bg-brand-950 dark:bg-white/5 relative overflow-hidden">
          <GridShape />
          <div className="relative z-10 flex flex-col items-center max-w-xs text-center">
            <Link href="/" className="mb-6 block">
              <Logo size="lg" theme="dark" />
            </Link>
            <p className="text-gray-400 dark:text-white/60 text-sm leading-relaxed">
              Professional home inspection management — from lead to report.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
