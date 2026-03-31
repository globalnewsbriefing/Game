import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Private Polymarket workspace",
  description:
    "Private Polymarket dashboard with authenticated access to live leaderboard, market, wallet, and CLI workflow views.",
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
