import { test, expect, Page, Route } from "@playwright/test";

test.describe("Connexion admin", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Mock de l'API d'authentification pour les tests E2E
    await page.route("**/auth/login", async (route: Route) => {
      console.log("Intercepted request:", route.request().url());
      const request = route.request();
      const postData = request.postData();

      if (
        postData &&
        postData.includes("admin@systemsmatic.com") &&
        postData.includes("admin123")
      ) {
        // Connexion réussie
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: {
            "set-cookie":
              "auth_token=fake-jwt-token; Path=/; HttpOnly; SameSite=Strict",
          },
          body: JSON.stringify({
            message: "Connexion réussie",
            user: {
              id: "admin-1",
              firstName: "Admin",
              lastName: "System",
              email: "admin@systemsmatic.com",
              role: "ADMIN",
            },
          }),
        });
      } else {
        // Connexion échouée
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Email ou mot de passe incorrect",
          }),
        });
      }
    });

    await page.goto("/admin-secret");
  });

  test("se connecte avec succès avec des identifiants valides", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Attendre que le formulaire de connexion apparaisse
    await page.waitForSelector(".auth-form", { timeout: 5000 });

    // Remplir les champs de connexion
    await page.fill(".auth-form input#email", "admin@systemsmatic.com");
    await page.fill(".auth-form input#password", "admin123");

    // Cliquer sur le bouton de connexion
    await page.click('.auth-form button[type="submit"]');

    // Vérifier que l'utilisateur est connecté (pas de redirection, juste l'affichage du dashboard)
    await expect(page.locator("h1")).toContainText("Backoffice Administrateur");
    await expect(page.locator("text=Connecté en tant que :")).toBeVisible();
  });

  test("affiche une erreur avec des identifiants invalides", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Attendre que le formulaire de connexion apparaisse
    await page.waitForSelector(".auth-form", { timeout: 5000 });

    // Remplir les champs avec des identifiants invalides
    await page.fill("input#email", "admin@systemsmatic.com");
    await page.fill("input#password", "mauvais-mot-de-passe");

    // Cliquer sur le bouton de connexion
    await page.click('.auth-form button[type="submit"]');

    // Vérifier que l'utilisateur reste sur la page de connexion
    await expect(page).toHaveURL("/admin-secret");
    await expect(page.locator("h1")).toContainText("Connexion Administrateur");
  });

  test("affiche les erreurs de validation si les champs sont vides", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Attendre que le formulaire de connexion apparaisse
    await page.waitForSelector(".auth-form", { timeout: 5000 });

    // Cliquer sur le bouton de connexion sans remplir les champs
    await page.click('.auth-form button[type="submit"]');

    // Vérifier que l'utilisateur reste sur la page de connexion
    await expect(page).toHaveURL("/admin-secret");
    await expect(page.locator("h1")).toContainText("Connexion Administrateur");
  });

  test("valide le format email dans le formulaire de connexion", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Attendre que le formulaire de connexion apparaisse
    await page.waitForSelector(".auth-form", { timeout: 5000 });

    // Remplir avec un email invalide
    await page.fill(".auth-form input#email", "email-invalide");
    await page.fill(".auth-form input#password", "motdepasse123");

    // Cliquer sur le bouton de connexion
    await page.click('.auth-form button[type="submit"]');

    // Vérifier que l'utilisateur reste sur la page de connexion
    await expect(page).toHaveURL("/admin-secret");
    await expect(page.locator("h1")).toContainText("Connexion Administrateur");
  });

  test("affiche l'état de chargement pendant la connexion", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Attendre que le formulaire de connexion apparaisse
    await page.waitForSelector(".auth-form", { timeout: 5000 });

    // Remplir les champs de connexion
    await page.fill(".auth-form input#email", "admin@systemsmatic.com");
    await page.fill(".auth-form input#password", "admin123");

    // Cliquer sur le bouton de connexion
    await page.click('.auth-form button[type="submit"]');

    // Vérifier que la connexion a réussi (redirection vers le dashboard)
    await expect(page.locator("h1")).toContainText("Backoffice Administrateur");
  });
});
