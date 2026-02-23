import type { Metadata } from "next";
import "./globals.css";
import { ReactQueryProvider } from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: "InspectOS Agent Portal",
  description: "Agent workspace and tenant selection portal",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
