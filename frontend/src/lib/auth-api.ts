import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const authClient = axios.create({
  baseURL: `${BACKEND_URL}/auth`,
});

export interface LoginCredentials {
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

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export const authApi = {
  // Connexion
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await authClient.post("/login", credentials);
    return response.data;
  },

  // Inscription
  register: async (data: RegisterData): Promise<UserProfile> => {
    const response = await authClient.post("/register", data);
    return response.data;
  },

  // Récupérer le profil utilisateur
  getProfile: async (token: string): Promise<UserProfile> => {
    const response = await authClient.get("/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

export default authApi;
