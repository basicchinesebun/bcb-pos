import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The POS For You",
  description: "Multi-tenant POS system for restaurants",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lo" data-theme="ocean">
      <body className="antialiased">{children}</body>
    </html>
  );
}
