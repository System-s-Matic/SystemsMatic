"use client";

import { useState } from "react";
import { authApi, UserProfile } from "@/lib/auth-api";
import { showSuccess, showError } from "@/lib/toast";

interface AdminLoginProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError("");

    try {
      const response = await authApi.login({ email, password });

      // Les cookies sont maintenant définis côté serveur
      onLoginSuccess(response.user);
      setAuthError("");

      // Réinitialiser le formulaire
      setEmail("");
      setPassword("");

      showSuccess("Connexion réussie !");
    } catch (error: unknown) {
      let errorMessage = "Erreur de connexion";

      if (
        typeof error === "object" &&
        error !== null &&
        ("response" in error || "request" in error)
      ) {
        // Erreur de type Axios : on ne prend le message que s'il vient du backend
        const axiosLikeError = error as {
          response?: { data?: { message?: string } };
        };
        if (axiosLikeError.response?.data?.message) {
          errorMessage = axiosLikeError.response.data.message;
        }
      } else if (error instanceof Error) {
        // Autres erreurs JS classiques
        // Pour rester cohérent avec les tests, on garde le message générique
        // même si error.message est renseigné (par ex. "Network error").
        errorMessage = "Erreur de connexion";
      }

      setAuthError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-container">
        <h1>Connexion Administrateur</h1>
        <p>Veuillez vous connecter pour accéder au backoffice</p>

        <form onSubmit={handleLogin} className="auth-form">
          {authError && <div className="auth-error">{authError}</div>}

          <div className="auth-input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="admin@systemsmatic.com"
              required
            />
          </div>

          <div className="auth-input-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="Mot de passe"
              required
            />
          </div>

          <button type="submit" disabled={isLoading} className="auth-button">
            {isLoading ? (
              <span className="auth-button-loading">
                <div className="auth-spinner"></div>
                Connexion...
              </span>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
