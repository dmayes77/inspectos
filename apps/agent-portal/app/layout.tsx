import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InspectOS Agent Portal",
  description: "Agent workspace and tenant selection portal",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
