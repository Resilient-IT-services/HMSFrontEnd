import type { Metadata } from "next";
import "@/app/globals.css";
import StoreProvider from "@/state/StoreProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";

import { ToastProvider } from "@/components/ui/Toast";
import { LayoutProvider } from "@/context/LayoutContext";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
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
