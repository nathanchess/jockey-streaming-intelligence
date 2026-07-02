import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Streaming Intelligence Demo | TwelveLabs Jockey",
  description:
    "Enterprise demo: metadata hydration, semantic search, personalized discovery, and FAST programming with Jockey.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
