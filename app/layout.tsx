import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Global News Briefing",
  description:
    "Live world news ranked and explained through geopolitical, economic, and political lenses.",
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
