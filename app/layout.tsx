import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Children's Book Platform",
  description: "Create illustrated children's books with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
