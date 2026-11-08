import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SitePulse Enterprise",
  description: "Technical SEO & Security Suite",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}