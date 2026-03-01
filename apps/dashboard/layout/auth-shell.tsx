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
    <div className="relative h-screen overflow-hidden bg-white dark:bg-gray-900">
      <div className="relative flex h-full w-full flex-col lg:flex-row">
        {/* Left — form content (provided by page) */}
        <div className="no-scrollbar flex h-full flex-1 flex-col overflow-y-auto lg:w-1/2">{children}</div>

        {/* Right — branding panel */}
        <div className="relative hidden h-full overflow-hidden bg-brand-950 dark:bg-white/5 lg:flex lg:w-1/2 lg:items-center lg:justify-center">
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
