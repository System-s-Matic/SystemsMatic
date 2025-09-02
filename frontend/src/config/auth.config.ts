export const authConfig = {
  // URL de l'API backend
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",

  // Clé de stockage local pour le token
  tokenKey: "auth_token",

  // Durée d'expiration du token (en secondes)
  tokenExpiration: 24 * 60 * 60, // 24 heures

  // Routes protégées
  protectedRoutes: ["/backoffice", "/admin"],

  // Routes publiques
  publicRoutes: ["/", "/login", "/register"],
};
