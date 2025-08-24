"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { login as apiLogin } from "lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const loginForm = useForm<LoginForm>();

  const onLoginSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setMessage("");

    try {
      const user = await apiLogin(data.email, data.password);
      setMessage("Connexion réussie!");

      // Mettre à jour le contexte d'authentification
      login(user);

      // Rediriger vers la page d'accueil après un court délai
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Erreur lors de la connexion"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__container">
        <div className="auth-page__header">
          <h2 className="auth-page__title">Connexion</h2>
          <p className="auth-page__subtitle">
            Connectez-vous à votre compte System's Matic
          </p>
        </div>

        <div className="auth-card">
          {message && (
            <div
              className={`auth-card__alert ${
                message.includes("réussie")
                  ? "auth-card__alert--success"
                  : "auth-card__alert--error"
              }`}
            >
              {message}
            </div>
          )}

          <form
            onSubmit={loginForm.handleSubmit(onLoginSubmit)}
            className="auth-form"
          >
            <div className="auth-form__group">
              <label htmlFor="email" className="auth-form__label">
                Email
              </label>
              <input
                {...loginForm.register("email", { required: "Email requis" })}
                type="email"
                className="auth-form__input"
                placeholder="votre@email.com"
              />
              {loginForm.formState.errors.email && (
                <p className="auth-form__error">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="auth-form__group">
              <label htmlFor="password" className="auth-form__label">
                Mot de passe
              </label>
              <input
                {...loginForm.register("password", {
                  required: "Mot de passe requis",
                })}
                type="password"
                className="auth-form__input"
                placeholder="••••••••"
              />
              {loginForm.formState.errors.password && (
                <p className="auth-form__error">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="auth-form__button auth-form__button--primary"
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <div className="auth-card__footer">
            <p className="auth-card__text">
              Pas encore de compte?{" "}
              <Link href="/register" className="auth-card__link">
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
