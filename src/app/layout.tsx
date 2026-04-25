import type { Metadata } from "next";
import "@/app/globals.css";
import StoreProvider from "@/state/StoreProvider";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";

import { ToastProvider } from "@/components/ui/Toast";
import { LayoutProvider } from "@/context/LayoutContext";

export const metadata: Metadata = {
  title: "HMS Frontend",
  description: "Hospital Management System frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
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
