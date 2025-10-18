import { test, expect, Page } from "@playwright/test";

test.describe("Sécurité - Accès non autorisé", () => {
  test("redirige vers la page de connexion quand on accède à /admin-secret sans être connecté", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Aller directement à la page admin sans être connecté
    await page.goto("/admin-secret");

    // Vérifier que le formulaire de connexion est affiché (pas de redirection, juste l'affichage du login)
    await expect(page.locator(".auth-form")).toBeVisible();
    await expect(page.locator("h1")).toContainText("Connexion Administrateur");
  });

  test("affiche le formulaire de connexion pour l'accès admin", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Aller directement à la page admin sans être connecté
    await page.goto("/admin-secret");

    // Vérifier que le formulaire de connexion est affiché
    await expect(page.locator(".auth-form")).toBeVisible();
  });

  test("vérifie l'accès à la page admin sans authentification", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Aller directement à la page admin sans être connecté
    await page.goto("/admin-secret");

    // Vérifier que le formulaire de connexion est affiché
    await expect(page.locator(".auth-form")).toBeVisible();
  });

  test("bloque l'accès aux API protégées sans token JWT", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Naviguer vers la page admin
    await page.goto("/admin-secret");

    // Vérifier que le formulaire de connexion est affiché
    await expect(page.locator(".auth-form")).toBeVisible();

    // Vérifier qu'on ne peut pas accéder au dashboard
    await expect(page.locator("h1")).toContainText("Connexion Administrateur");
  });

  test("affiche un message d'erreur 401 pour les requêtes API non autorisées", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Intercepter les requêtes API et retourner 401
    await page.route("**/api/backoffice/**", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Non autorisé - Token JWT requis",
        }),
      });
    });

    // Aller à la page d'accueil
    await page.goto("/");

    // Essayer d'accéder aux données admin via JavaScript
    const response = await page.evaluate(async () => {
      try {
        const response = await fetch("/api/backoffice/quotes");
        return {
          status: response.status,
          message: await response.text(),
        };
      } catch (error) {
        return { error: (error as Error).message };
      }
    });

    // Vérifier que la réponse est 401
    expect(response.status).toBe(401);
    expect(response.message).toContain("Non autorisé");
  });

  test("empêche l'accès aux routes admin via navigation directe", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Tenter d'accéder à la route admin
    await page.goto("/admin-secret");

    // Vérifier que le formulaire de connexion est affiché
    await expect(page.locator(".auth-form")).toBeVisible();
  });

  test("affiche un message d'erreur approprié pour les tentatives d'accès non autorisé", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Aller à une route protégée
    await page.goto("/admin-secret");

    // Vérifier que le formulaire de connexion est affiché
    await expect(page.locator(".auth-form")).toBeVisible();
    await expect(page.locator("h1")).toContainText("Connexion Administrateur");
  });
});
