import type { Metadata } from "next";
import DevTools from "@/components/DevTools";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus Dashboard",
  description: "Tamina HQ Command Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-text-primary font-sans">
        {children}
        <DevTools />
      </body>
    </html>
  );
}

