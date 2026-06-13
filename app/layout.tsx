import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Celo MCP — Read + write access to Celo for any LLM",
  description:
    "An open-source remote MCP server that gives any LLM read + write access to Celo — balances, swaps, sends, ERC-8004 agent identity, and x402 payments. Unsigned-tx writes, no key custody. Zero install.",
  openGraph: {
    title: "Celo MCP — Talk to Celo from any LLM",
    description:
      "Remote, write-enabled MCP server for Celo. 8 tools, unsigned-tx writes, ERC-8004 + x402. Add a URL, no install.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
