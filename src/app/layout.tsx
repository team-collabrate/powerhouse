import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Used only for the agency name in the sidebar (Korto by Talbot Type is a
// paid commercial font. This is the closest free stand-in until a licence
// + font files are provided). See CLAUDE.md: Inter stays the app-wide font.
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Powerhouse",
  description: "Real-time project profitability for contract-based agencies",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} h-full`}>
      <body className="min-h-full">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
