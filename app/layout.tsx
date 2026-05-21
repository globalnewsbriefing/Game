import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kalshi BTC 15-Min Signal",
  description: "A live decision dashboard for Kalshi Bitcoin 15-minute up/down markets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
