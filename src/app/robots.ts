import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/shared/lib/site";

/** Публична только `/`. Host без схемы (Yandex). Sitemap нет — доски приватные. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/api/", "/login", "/register"],
    },
    host: getSiteUrl().host,
  };
}
