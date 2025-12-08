import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import * as Sentry from '@sentry/nextjs';

const inter = Inter({ subsets: ["latin"] });

export function generateMetadata(): Metadata {
  return {
    title: {
      default: "TenderWatch - AI-Powered Tender Intelligence",
      template: "%s | TenderWatch"
    },
    description: "Never miss a government tender again. AI-powered matching and summaries for Australian businesses.",
    keywords: ["government tenders", "australian tenders", "tender alerts", "procurement", "AusTender"],
    authors: [{ name: "TenderWatch" }],
    openGraph: {
      type: "website",
      locale: "en_AU",
      url: "https://tenderwatch.io",
      siteName: "TenderWatch",
      title: "TenderWatch - AI-Powered Tender Intelligence",
      description: "Never miss a government tender again."
    },
    other: {
      ...Sentry.getTraceData()
    }
  };
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}