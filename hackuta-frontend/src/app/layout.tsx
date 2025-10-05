import type { Metadata } from "next";
import { Inter, Lexend } from "next/font/google";

import "./globals.css";

import { CampaignProvider } from "@/context/CampaignContext";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AdSett | Marketing Intelligence for High-Performing Teams",
  description:
    "AdSett delivers AI-powered creative critique, publication, and performance insights so marketing teams can move from idea to impact faster.",
  metadataBase: new URL("https://adsett.io"),
  openGraph: {
    title: "AdSett | Marketing Intelligence for High-Performing Teams",
    description:
      "Upload, critique, publish, and analyze ads in one automated workflow.",
    url: "https://adsett.io",
    siteName: "AdSett",
  },
  twitter: {
    card: "summary_large_image",
    title: "AdSett | Marketing Intelligence for High-Performing Teams",
    description:
      "AI-driven feedback and publishing workflow for modern marketing teams.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lexend.variable} ${inter.variable}`}>
      <body className="antialiased bg-background text-foreground font-body">
        <CampaignProvider>
          <div className="relative min-h-screen overflow-x-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#2563EB1a,transparent_55%)]"
            />
            <main>{children}</main>
          </div>
        </CampaignProvider>
      </body>
    </html>
  );
}
