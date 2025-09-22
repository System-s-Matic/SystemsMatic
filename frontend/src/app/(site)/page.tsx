import { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "SystemsMatic - Portes, Portails et Automatismes en Guadeloupe",
  description:
    "Spécialiste en automatisation en Guadeloupe. Installation et maintenance de portes, portails, ascenseurs et solutions d'accessibilité. Devis gratuit.",
  keywords:
    "automatisme, portail, porte, ascenseur, Guadeloupe, installation, maintenance, devis",
  openGraph: {
    title: "SystemsMatic - Portes, Portails et Automatismes en Guadeloupe",
    description:
      "Spécialiste en automatisation en Guadeloupe. Installation et maintenance de portes, portails, ascenseurs et solutions d'accessibilité.",
    type: "website",
    locale: "fr_FR",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Home() {
  return <HomeClient />;
}
