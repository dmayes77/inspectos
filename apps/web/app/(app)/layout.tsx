import { ReactNode } from "react";
import { BrandingProvider } from "@/components/providers/branding-provider";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <BrandingProvider>{children}</BrandingProvider>;
}
