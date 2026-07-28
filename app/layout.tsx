import type { Metadata, Viewport } from "next";
import { Logo } from "@/components/Logo";
import "./globals.css";

export const metadata: Metadata = {
  title: "Greenshades Event Scanner",
  description:
    "Scan a trade-show badge, review the details, and push to HubSpot.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-screen max-w-md flex-col">
          <header className="border-b border-gray-200 bg-white px-4 py-3">
            <Logo className="h-8 w-auto" />
          </header>
          <main className="flex-1 p-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
