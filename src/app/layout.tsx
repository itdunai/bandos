import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { PwaRegister } from "@/components/pwa-register";
import { ToastProvider } from "@/components/ui/toast-provider";
import { consumeToast } from "@/lib/redirect-with-toast";
import { getSupabasePublicConfig } from "@/lib/supabase/public-config";
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
  const supabaseConfig = getSupabasePublicConfig();

  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SupabaseProvider config={supabaseConfig}>
          <PwaRegister />
          <ToastProvider initial={toast}>
            <NavigationProgress />
            {children}
          </ToastProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
