import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BuildShaProvider } from "@/components/layout/build-sha-context";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { PublicConfigScript } from "@/components/providers/public-config-script";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { PwaRegister } from "@/components/pwa-register";
import { CookieConsentBanner } from "@/components/legal/cookie-consent-banner";
import { ToastProvider } from "@/components/ui/toast-provider";
import { validateRuntimeEnv } from "@/lib/env";
import {
  COOKIE_CONSENT_COOKIE,
  isCookieConsentAccepted,
} from "@/lib/legal/cookie-consent";
import { consumeToast } from "@/lib/redirect-with-toast";
import { getSupabasePublicConfig } from "@/lib/supabase/public-config";
import { cookies } from "next/headers";
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
  const cookieStore = await cookies();
  const showCookieBanner = !isCookieConsentAccepted(
    cookieStore.get(COOKIE_CONSENT_COOKIE)?.value
  );

  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased${showCookieBanner ? " cookie-consent-open" : ""}`}
    >
      <body className="min-h-full">
        <PublicConfigScript config={supabaseConfig} />
        <SupabaseProvider config={supabaseConfig}>
          <BuildShaProvider sha={buildSha}>
            <PwaRegister />
            <ToastProvider initial={toast}>
              <NavigationProgress />
              {children}
              {showCookieBanner && <CookieConsentBanner />}
            </ToastProvider>
          </BuildShaProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
