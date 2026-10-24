import type { Metadata } from "next";
import { Geist_Mono, Golos_Text, Unbounded } from "next/font/google";
import { BuildShaProvider } from "@/components/layout/build-sha-context";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { PublicConfigScript } from "@/components/providers/public-config-script";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { PwaRegister } from "@/components/pwa-register";
import { CookieConsentBanner } from "@/components/legal/cookie-consent-banner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { validateRuntimeEnv } from "@/lib/env";
import {
  COOKIE_CONSENT_COOKIE,
  isCookieConsentAccepted,
} from "@/lib/legal/cookie-consent";
import { consumeToast } from "@/lib/redirect-with-toast";
import { getSupabasePublicConfig } from "@/lib/supabase/public-config";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";
import { cookies } from "next/headers";
import "./globals.css";

const golos = Golos_Text({
  variable: "--font-golos",
  subsets: ["latin", "cyrillic"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700", "800"],
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
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/logo.svg",
  },
  appleWebApp: {
    capable: true,
    title: "BandOS",
  },
};

export const viewport = {
  viewportFit: "cover" as const,
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
  const theme = parseTheme(cookieStore.get(THEME_COOKIE)?.value);

  return (
    <html
      lang="ru"
      data-theme={theme}
      className={`${golos.variable} ${unbounded.variable} ${geistMono.variable} h-full antialiased${showCookieBanner ? " cookie-consent-open" : ""}`}
    >
      <body className="min-h-full">
        <PublicConfigScript config={supabaseConfig} />
        <ThemeProvider initialTheme={theme}>
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
        </ThemeProvider>
      </body>
    </html>
  );
}
