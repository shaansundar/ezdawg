"use client";

import { Inter } from "next/font/google";

import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { RainbowProvider } from "@/components/providers/rainbow-provider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

// export const metadata: Metadata = {
//   title: "EZDAWG - Hyperliquid SIP Platform",
//   description: "Smart investment portal for Hyperliquid spot assets",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased relative min-h-screen min-w-screen`}
      >
        <div className="min-h-screen w-full relative">
          {/* Dashed Top Fade Grid */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `
         linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
         linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
       `,
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 0 0",
              maskImage: `
         repeating-linear-gradient(
               to right,
               black 0px,
               black 3px,
               transparent 3px,
               transparent 8px
             ),
             repeating-linear-gradient(
               to bottom,
               black 0px,
               black 3px,
               transparent 3px,
               transparent 8px
             ),
             radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)
       `,
              WebkitMaskImage: `
  repeating-linear-gradient(
               to right,
               black 0px,
               black 3px,
               transparent 3px,
               transparent 8px
             ),
             repeating-linear-gradient(
               to bottom,
               black 0px,
               black 3px,
               transparent 3px,
               transparent 8px
             ),
             radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)
       `,
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          />
          {/* Your Content/Components */}
          <div className="relative z-10">
            <RainbowProvider>
              {children}
              <Toaster />
            </RainbowProvider>
          </div>
        </div>
      </body>
    </html>
  );
}
