import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // URL dynamique selon l'environnement
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.NETLIFY_URL
      ? `https://${process.env.NETLIFY_URL}`
      : "https://systemsmatic.com";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },

    {
      url: `${baseUrl}/#services`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/#quote-form`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/#about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
