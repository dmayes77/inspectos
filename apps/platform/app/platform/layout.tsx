import type { ReactNode } from "react";
import Link from "next/link";

const nav = [
  { href: "/platform", label: "Overview" },
  { href: "/platform/companies", label: "Companies" },
  { href: "/platform/features", label: "Features" },
  { href: "/platform/pricing", label: "Pricing" },
  { href: "/platform/content", label: "Content" },
];

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="text-sm font-semibold">InspectOS Platform</div>
          <nav className="flex items-center gap-4 text-sm">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
