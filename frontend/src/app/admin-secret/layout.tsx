import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Administration - System's Matic",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    noarchive: true,
    noimageindex: true,
    nosnippet: true,
  },
  // Empêcher l'affichage dans les réseaux sociaux
  openGraph: {
    title: "Page privée",
    description: "Accès restreint",
  },
  // Empêcher la mise en cache
  other: {
    "cache-control": "no-cache, no-store, must-revalidate",
    pragma: "no-cache",
    expires: "0",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Meta tags de sécurité supplémentaires */}
      <meta
        name="robots"
        content="noindex,nofollow,noarchive,nosnippet,noimageindex,nocache"
      />
      <meta
        name="googlebot"
        content="noindex,nofollow,noarchive,nosnippet,noimageindex"
      />
      <meta
        name="bingbot"
        content="noindex,nofollow,noarchive,nosnippet,noimageindex"
      />
      <meta
        httpEquiv="cache-control"
        content="no-cache, no-store, must-revalidate"
      />
      <meta httpEquiv="pragma" content="no-cache" />
      <meta httpEquiv="expires" content="0" />

      {children}
    </>
  );
}
