import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { PublicConfigScript } from "@/components/providers/public-config-script";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { PwaRegister } from "@/components/pwa-register";
import { ToastProvider } from "@/components/ui/toast-provider";
import { validateRuntimeEnv } from "@/lib/env";
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
  title: "BandOS — всё для музыкальной группы в одном месте",
  description:
    "Репертуар, сет-листы, режим «Играем», график, финансы и публичная страница для заказчиков. Бесплатно для кавер- и авторских групп.",
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
  validateRuntimeEnv();
  const toast = await consumeToast();
  const supabaseConfig = getSupabasePublicConfig();
  const buildSha = process.env.BUILD_SHA ?? "dev";

  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <PublicConfigScript config={supabaseConfig} />
        <SupabaseProvider config={supabaseConfig}>
          <PwaRegister />
          <ToastProvider initial={toast}>
            <NavigationProgress />
            {children}
            <div
              className="pointer-events-none fixed bottom-2 right-2 z-50 rounded-md border border-border bg-bg/90 px-2 py-1 text-[10px] text-text-muted backdrop-blur"
              title="Версия текущего деплоя"
            >
              build: {buildSha}
            </div>
          </ToastProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
