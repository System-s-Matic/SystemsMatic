import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Instance axios pour l'authentification
const authClient = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  withCredentials: true, // Important pour envoyer les cookies
});

// Types
export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResponse {
  message: string;
  user: UserProfile;
}

export interface RegisterResponse {
  message: string;
  user: UserProfile;
}

// API d'authentification
export const authApi = {
  // Connexion
  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await authClient.post("/login", data);
    return response.data;
  },

  // Inscription
  register: async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await authClient.post("/register", data);
    return response.data;
  },

  // Déconnexion
  logout: async (): Promise<void> => {
    await authClient.post("/logout");
  },

  // Récupérer le profil utilisateur
  getProfile: async (): Promise<UserProfile> => {
    const response = await authClient.get("/profile");
    return response.data;
  },
};
