import type { MetadataRoute } from "next";
import { absoluteUrl, siteOrigin } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/rider/", "/privacy"],
        // Служебное и личное: кабинеты групп закрыты входом, но не тратим на них бюджет обхода.
        // /repertoire/ — дубль /rider/ (canonical указывает на /rider/).
        disallow: ["/api/", "/admin", "/auth/", "/invite/", "/login", "/new-band", "/forbidden", "/repertoire/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteOrigin(),
  };
}
