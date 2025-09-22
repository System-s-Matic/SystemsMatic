import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // URL dynamique selon l'environnement
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NETLIFY_URL
      ? `https://${process.env.NETLIFY_URL}`
      : "https://systemsmatic.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin-secret/", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
