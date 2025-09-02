import Cookies from "js-cookie";

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

// Configuration des cookies
const COOKIE_OPTIONS = {
  expires: 7, // Expire dans 7 jours
  secure: process.env.NODE_ENV === "production", // HTTPS en production
  sameSite: "strict" as const, // Protection CSRF
  path: "/", // Accessible sur tout le site
};

export const authCookies = {
  // Stocker le token d'authentification
  setToken: (token: string) => {
    Cookies.set(AUTH_TOKEN_KEY, token, COOKIE_OPTIONS);
  },

  // Récupérer le token d'authentification
  getToken: (): string | undefined => {
    return Cookies.get(AUTH_TOKEN_KEY);
  },

  // Supprimer le token d'authentification
  removeToken: () => {
    Cookies.remove(AUTH_TOKEN_KEY, { path: "/" });
  },

  // Stocker les informations utilisateur
  setUser: (user: any) => {
    Cookies.set(AUTH_USER_KEY, JSON.stringify(user), COOKIE_OPTIONS);
  },

  // Récupérer les informations utilisateur
  getUser: (): any | null => {
    const userData = Cookies.get(AUTH_USER_KEY);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Supprimer les informations utilisateur
  removeUser: () => {
    Cookies.remove(AUTH_USER_KEY, { path: "/" });
  },

  // Vérifier si l'utilisateur est authentifié
  isAuthenticated: (): boolean => {
    return !!Cookies.get(AUTH_TOKEN_KEY);
  },

  // Nettoyer toutes les données d'authentification
  clear: () => {
    Cookies.remove(AUTH_TOKEN_KEY, { path: "/" });
    Cookies.remove(AUTH_USER_KEY, { path: "/" });
  },
};
