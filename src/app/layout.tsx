import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "@/app/globals.css";
import StoreProvider from "@/state/StoreProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";

import { ToastProvider } from "@/components/ui/Toast";
import { LayoutProvider } from "@/context/LayoutContext";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "CareFlow",
  description: "Modern Hospital Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${manrope.variable}`}>
      <body className="antialiased">
        <StoreProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <LayoutProvider>
                  {children}
                </LayoutProvider>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
