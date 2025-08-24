import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  withCredentials: true, // Inclure les cookies dans les requêtes
});

// Intercepteur pour ajouter le token dans les headers si disponible
api.interceptors.request.use((config) => {
  // Essayer d'abord le localStorage (pour la production)
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Fallback vers les cookies (pour le développement)
    const cookies = document.cookie.split(";");
    const accessTokenCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("access_token=")
    );
    if (accessTokenCookie) {
      const cookieToken = accessTokenCookie.split("=")[1];
      if (cookieToken && cookieToken !== "") {
        config.headers.Authorization = `Bearer ${cookieToken}`;
      }
    }
  }
  return config;
});

// Fonction pour stocker le token de manière sécurisée
export const setAuthToken = (token: string) => {
  // En production, ajouter une vérification de l'environnement
  if (typeof window !== "undefined") {
    // Vérifier que le token semble valide (JWT basique)
    if (token && token.split(".").length === 3) {
      localStorage.setItem("access_token", token);

      // Optionnel : ajouter un timestamp d'expiration côté client
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24h
      localStorage.setItem("access_token_expires", expiresAt.toString());
    } else {
      console.warn("Token invalide, non stocké");
    }
  }
};

// Fonction pour supprimer le token
export const removeAuthToken = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("access_token_expires");
  // Nettoyer aussi les cookies
  document.cookie =
    "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
};

// Fonction pour récupérer le token avec vérification d'expiration
export const getAuthToken = () => {
  // Vérifier d'abord l'expiration côté client
  const expiresAt = localStorage.getItem("access_token_expires");
  if (expiresAt && Date.now() > parseInt(expiresAt)) {
    console.log("Token expiré côté client, nettoyage...");
    removeAuthToken();
    return null;
  }

  // Essayer localStorage d'abord
  const token = localStorage.getItem("access_token");
  if (token) return token;

  // Fallback vers cookies
  const cookies = document.cookie.split(";");
  const accessTokenCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("access_token=")
  );
  if (accessTokenCookie) {
    const cookieToken = accessTokenCookie.split("=")[1];
    if (cookieToken && cookieToken !== "") {
      return cookieToken;
    }
  }
  return null;
};

// Fonction pour se déconnecter
export const logout = async () => {
  try {
    await api.post("/auth/logout");
    removeAuthToken();
    return true;
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    // En cas d'erreur, on force la déconnexion côté client
    removeAuthToken();
    return true;
  }
};

// Fonction pour vérifier si l'utilisateur est connecté
export const checkAuth = async () => {
  try {
    const token = getAuthToken();

    if (!token) {
      console.log("Aucun token valide trouvé");
      return null;
    }

    const response = await api.get("/auth/profile");

    // Vérifier que la réponse contient les données nécessaires
    if (response.data && response.data.id) {
      return response.data;
    }
    return null;
  } catch (error: any) {
    console.error("Erreur lors de la vérification d'authentification:", error);
    if (error.response?.status === 401) {
      // Token expiré ou invalide, le supprimer
      removeAuthToken();
    }
    return null;
  }
};

// Fonction pour se connecter
export const login = async (email: string, password: string) => {
  try {
    const response = await api.post("/auth/login", { email, password });

    if (response.data?.user) {
      // Si le token est dans la réponse (production), l'utiliser
      if (response.data.access_token) {
        setAuthToken(response.data.access_token);
      }

      return response.data.user;
    }

    throw new Error("Données utilisateur manquantes");
  } catch (error: any) {
    console.error("Erreur lors de la connexion:", error);
    throw error;
  }
};
