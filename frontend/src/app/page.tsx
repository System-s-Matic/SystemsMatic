"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loginForm = useForm<LoginForm>();
  const registerForm = useForm<RegisterForm>();

  const onLoginSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await axios.post("/api/auth/login", data);
      setMessage("Connexion réussie!");
      console.log("Token:", response.data.access_token);
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Erreur lors de la connexion"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setMessage("");

    try {
      await axios.post("/api/users", data);
      setMessage("Inscription réussie! Vous pouvez maintenant vous connecter.");
      setIsLogin(true);
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Erreur lors de l'inscription"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            System's Matic
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isLogin ? "Connectez-vous à votre compte" : "Créez votre compte"}
          </p>
        </div>

        <div className="card">
          {message && (
            <div
              className={`alert ${
                message.includes("réussie") ? "alert-success" : "alert-error"
              }`}
            >
              {message}
            </div>
          )}

          {isLogin ? (
            <form
              onSubmit={loginForm.handleSubmit(onLoginSubmit)}
              className="space-y-6"
            >
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  {...loginForm.register("email", { required: "Email requis" })}
                  type="email"
                  className="input-field"
                  placeholder="votre@email.com"
                />
                {loginForm.formState.errors.email && (
                  <p className="error-message">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Mot de passe
                </label>
                <input
                  {...loginForm.register("password", {
                    required: "Mot de passe requis",
                  })}
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                />
                {loginForm.formState.errors.password && (
                  <p className="error-message">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="firstName" className="form-label">
                    Prénom
                  </label>
                  <input
                    {...registerForm.register("firstName", {
                      required: "Prénom requis",
                    })}
                    type="text"
                    className="input-field"
                    placeholder="John"
                  />
                  {registerForm.formState.errors.firstName && (
                    <p className="error-message">
                      {registerForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName" className="form-label">
                    Nom
                  </label>
                  <input
                    {...registerForm.register("lastName", {
                      required: "Nom requis",
                    })}
                    type="text"
                    className="input-field"
                    placeholder="Doe"
                  />
                  {registerForm.formState.errors.lastName && (
                    <p className="error-message">
                      {registerForm.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Nom d'utilisateur
                </label>
                <input
                  {...registerForm.register("username", {
                    required: "Nom d'utilisateur requis",
                  })}
                  type="text"
                  className="input-field"
                  placeholder="john_doe"
                />
                {registerForm.formState.errors.username && (
                  <p className="error-message">
                    {registerForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  {...registerForm.register("email", {
                    required: "Email requis",
                  })}
                  type="email"
                  className="input-field"
                  placeholder="votre@email.com"
                />
                {registerForm.formState.errors.email && (
                  <p className="error-message">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Mot de passe
                </label>
                <input
                  {...registerForm.register("password", {
                    required: "Mot de passe requis",
                  })}
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                />
                {registerForm.formState.errors.password && (
                  <p className="error-message">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? "Inscription..." : "S'inscrire"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage("");
                loginForm.reset();
                registerForm.reset();
              }}
              className="btn-link"
            >
              {isLogin
                ? "Pas encore de compte? S'inscrire"
                : "Déjà un compte? Se connecter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
