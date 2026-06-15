import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { PwaRegister } from "@/components/pwa-register";
import { ToastProvider } from "@/components/ui/toast-provider";
import { consumeToast } from "@/lib/redirect-with-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BandOS",
  description: "Единое пространство для музыкальной группы",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "BandOS",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const toast = await consumeToast();

  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <PwaRegister />
        <ToastProvider initial={toast}>
          <NavigationProgress />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
