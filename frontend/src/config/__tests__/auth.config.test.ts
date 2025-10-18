import { authConfig } from "../auth.config";

describe("Auth Config", () => {
  describe("Configuration de base", () => {
    it("devrait avoir une URL API par défaut", () => {
      expect(authConfig.apiUrl).toBeDefined();
      expect(typeof authConfig.apiUrl).toBe("string");
    });

    it("devrait utiliser l'URL de l'environnement si disponible", () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_URL;
      process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";

      // Recharger le module pour prendre en compte la nouvelle variable d'environnement
      jest.resetModules();
      const { authConfig: newAuthConfig } = require("../auth.config");

      expect(newAuthConfig.apiUrl).toBe("https://api.example.com");

      // Restaurer l'environnement original
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    });

    it("devrait utiliser l'URL par défaut si NEXT_PUBLIC_API_URL n'est pas définie", () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_URL;
      delete process.env.NEXT_PUBLIC_API_URL;

      jest.resetModules();
      const { authConfig: newAuthConfig } = require("../auth.config");

      expect(newAuthConfig.apiUrl).toBe("http://localhost:3001");

      // Restaurer l'environnement original
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    });
  });

  describe("Configuration du token", () => {
    it("devrait avoir une clé de token définie", () => {
      expect(authConfig.tokenKey).toBe("auth_token");
    });

    it("devrait avoir une durée d'expiration définie", () => {
      expect(authConfig.tokenExpiration).toBe(24 * 60 * 60); // 24 heures en secondes
    });
  });

  describe("Configuration des routes", () => {
    it("devrait avoir des routes protégées définies", () => {
      expect(authConfig.protectedRoutes).toEqual(["/backoffice", "/admin"]);
      expect(Array.isArray(authConfig.protectedRoutes)).toBe(true);
    });

    it("devrait avoir des routes publiques définies", () => {
      expect(authConfig.publicRoutes).toEqual(["/", "/login", "/register"]);
      expect(Array.isArray(authConfig.publicRoutes)).toBe(true);
    });

    it("devrait avoir des routes protégées non vides", () => {
      expect(authConfig.protectedRoutes.length).toBeGreaterThan(0);
    });

    it("devrait avoir des routes publiques non vides", () => {
      expect(authConfig.publicRoutes.length).toBeGreaterThan(0);
    });
  });

  describe("Types et structure", () => {
    it("devrait être un objet", () => {
      expect(typeof authConfig).toBe("object");
      expect(authConfig).not.toBeNull();
    });

    it("devrait avoir toutes les propriétés requises", () => {
      expect(authConfig).toHaveProperty("apiUrl");
      expect(authConfig).toHaveProperty("tokenKey");
      expect(authConfig).toHaveProperty("tokenExpiration");
      expect(authConfig).toHaveProperty("protectedRoutes");
      expect(authConfig).toHaveProperty("publicRoutes");
    });
  });
});
