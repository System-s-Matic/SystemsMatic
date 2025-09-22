"use client";

import { useState } from "react";
import { authApi } from "@/lib/auth-api";
import { showSuccess, showError } from "@/lib/toast";

interface AdminLoginProps {
  onLoginSuccess: (user: any) => void;
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
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erreur de connexion";
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
