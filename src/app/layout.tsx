import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TokoKu — Terminal POS & Inventory",
  description: "Sistem Manajemen Kasir & Inventaris Warung Kelontong Modern",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-tokoku-bg text-tokoku-text-primary">
        {children}
      </body>
    </html>
  );
}
