import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  withCredentials: true, // Inclure les cookies dans les requêtes
});

// Fonction pour nettoyer les cookies vides
const clearEmptyCookies = () => {
  const cookies = document.cookie.split(";");
  cookies.forEach((cookie) => {
    const [name, value] = cookie.trim().split("=");
    if (name === "access_token" && (!value || value === "")) {
      // Supprimer le cookie vide en le définissant avec une date d'expiration passée
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });
};

// Fonction pour se déconnecter
export const logout = async () => {
  try {
    // Nettoyer les cookies vides avant la déconnexion
    clearEmptyCookies();

    await api.post("/auth/logout");
    return true;
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
    // En cas d'erreur, on considère que la déconnexion a réussi côté client
    // car le cookie pourrait avoir été supprimé malgré l'erreur
    return true;
  }
};

// Fonction pour vérifier si l'utilisateur est connecté
export const checkAuth = async () => {
  try {
    // Vérifier si le cookie access_token existe et n'est pas vide
    const cookies = document.cookie.split(";");
    const accessTokenCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("access_token=")
    );

    if (!accessTokenCookie || accessTokenCookie.split("=")[1] === "") {
      console.log("Aucun token valide trouvé dans les cookies");
      // Nettoyer les cookies vides
      clearEmptyCookies();
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
    return null;
  }
};
