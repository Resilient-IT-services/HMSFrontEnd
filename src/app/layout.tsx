import type { Metadata } from "next";
import "@/app/globals.css";
import StoreProvider from "@/state/StoreProvider";

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
      <body className="antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
