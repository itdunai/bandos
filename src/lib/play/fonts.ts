import { Inter, JetBrains_Mono, Nunito, Roboto_Condensed } from "next/font/google";
import type { ResolvedPlayFont } from "@/lib/play/text-prefs";

/**
 * Шрифты для «Играем». Файлы лежат на нашем сервере (next/font), preload
 * выключен — браузер скачивает шрифт, только когда его выбрали.
 */
const inter = Inter({ subsets: ["latin", "cyrillic"], preload: false, display: "swap" });
const robotoCondensed = Roboto_Condensed({
  subsets: ["latin", "cyrillic"],
  preload: false,
  display: "swap",
});
const nunito = Nunito({ subsets: ["latin", "cyrillic"], preload: false, display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin", "cyrillic"], preload: false, display: "swap" });

export const PLAY_FONT_CLASS: Record<ResolvedPlayFont, string> = {
  "site-mono": "font-mono",
  "site-sans": "font-sans",
  golos: "font-sans",
  inter: inter.className,
  "roboto-condensed": robotoCondensed.className,
  nunito: nunito.className,
  jetbrains: jetbrains.className,
};
