import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stayora — Find your next stay, experience, and service",
  description: "Stayora is a marketplace for unique stays, hosted experiences, and trusted local services. Discover villas, cabins, lofts, and apartments in 50+ destinations worldwide.",
  keywords: ["Stayora", "vacation rentals", "stays", "experiences", "hosting", "Airbnb alternative", "travel"],
  authors: [{ name: "Stayora" }],
  openGraph: {
    title: "Stayora — Find your next stay, experience, and service",
    description: "A marketplace for unique stays, hosted experiences, and trusted local services.",
    siteName: "Stayora",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stayora",
    description: "Find your next stay, experience, and service.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
