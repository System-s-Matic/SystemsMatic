import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // URL dynamique selon l'environnement
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NETLIFY_URL
      ? `https://${process.env.NETLIFY_URL}`
      : "https://systemsmatic.com");

  // Bloquer l'indexation si pas de domaine personnalisé
  const hasCustomDomain = process.env.NEXT_PUBLIC_SITE_URL;

  if (hasCustomDomain) {
    // Production avec domaine personnalisé
    return {
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin-secret/", "/api/"],
      },
      sitemap: `${baseUrl}/sitemap.xml`,
    };
  } else {
    // Développement (local ou Netlify sans domaine)
    return {
      rules: {
        userAgent: "*",
        disallow: "/", // Bloquer tout le site
      },
    };
  }
}
