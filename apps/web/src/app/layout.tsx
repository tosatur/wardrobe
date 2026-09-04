import type { ReactNode } from "react";
import "./globals.css";
import { Archivo, Space_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Nav } from "@/components/nav";
import { Providers } from "./providers";

// One grotesque family for body + display (regular vs. black weight) rather
// than a second, warmer face, a tighter, more monolithic system matching
// the reference's low-contrast, unified type treatment.
const archivoSans = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});
const archivoHeading = Archivo({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-heading",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const metadata = {
  title: "Wardrobe Manager",
};

export default function RootLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        "font-sans",
        archivoSans.variable,
        archivoHeading.variable,
        spaceMono.variable,
      )}
      suppressHydrationWarning
    >
      <body>
        {/* The industrial signature, app-wide: a faint schematic grid behind
            every page, "structural grid behind the media," never loud
            enough to compete with it. Fixed so it never scrolls with, or
            has to be re-added to, individual pages. */}
        <div aria-hidden className="schematic-grid pointer-events-none fixed inset-0 -z-10" />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <Nav />
            {children}
            {modal}
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
