import axios from "axios";
import { getCookie, setCookie, removeCookie } from "./cookies";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  withCredentials: true, // Inclure les cookies dans les requêtes
});

// Les cookies httpOnly sont automatiquement envoyés par le navigateur
// Le backend les lit via la JWT strategy - pas besoin d'intercepteur côté client
// Intercepteur supprimé pour utiliser uniquement les cookies sécurisés

// Fonction pour stocker le token - uniquement pour les cas spéciaux
export const setAuthToken = (token: string) => {
  // Les cookies httpOnly sont gérés automatiquement par le backend
  // Cette fonction n'est plus nécessaire dans le flux normal
  console.log("Token géré automatiquement par les cookies httpOnly");
};

// Fonction pour supprimer le token
export const removeAuthToken = () => {
  // Les cookies httpOnly sont supprimés automatiquement par le backend lors du logout
  // Cette fonction n'est plus nécessaire
};

// Fonction pour récupérer le token
export const getAuthToken = () => {
  // Les cookies httpOnly ne sont pas accessibles côté client
  // Cette fonction n'est plus nécessaire - les tokens sont gérés automatiquement
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
    // Avec les cookies httpOnly, on fait directement la requête
    // Le cookie sera envoyé automatiquement par le navigateur
    const response = await api.get("/auth/profile");

    // Vérifier que la réponse contient les données nécessaires
    if (response.data && response.data.id) {
      return response.data;
    }
    return null;
  } catch (error: any) {
    console.error("Erreur lors de la vérification d'authentification:", error);
    if (error.response?.status === 401) {
      // Token expiré ou invalide - les cookies sont gérés automatiquement
      console.log("Utilisateur non connecté ou token expiré");
    }
    return null;
  }
};

// Fonction pour se connecter
export const login = async (email: string, password: string) => {
  try {
    const response = await api.post("/auth/login", { email, password });

    if (response.data?.user) {
      // Le token est automatiquement défini dans les cookies httpOnly par le backend
      // Plus besoin de gérer le token côté client
      return response.data.user;
    }

    throw new Error("Données utilisateur manquantes");
  } catch (error: any) {
    console.error("Erreur lors de la connexion:", error);
    throw error;
  }
};
