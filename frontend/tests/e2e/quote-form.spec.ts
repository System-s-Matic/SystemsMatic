import { test, expect, Page } from "@playwright/test";

test.describe("Formulaire de devis — Système System's Matic", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Accéder à la page contenant le formulaire
    await page.goto("/");
    await page.waitForSelector("#quote-form");
  });

  test("affiche les erreurs si les champs requis sont vides", async ({
    page,
  }) => {
    // Soumettre le formulaire vide
    await page.click('#quote-form button[type="submit"]');

    // Attendre le toast ou les erreurs visibles
    await expect(page.getByText("Veuillez corriger les erreurs")).toBeVisible();

    // Vérifier les erreurs de validation
    await expect(page.getByText("Le prénom est requis")).toBeVisible();
    await expect(page.getByText("Le nom est requis")).toBeVisible();
    await expect(page.getByText("L'email est requis")).toBeVisible();
    await expect(page.getByText("Le message est requis")).toBeVisible();

    await expect(
      page.getByText("Vous devez accepter les conditions générales")
    ).toBeVisible();
  });

  test("désactive la case téléphone quand le champ est vide", async ({
    page,
  }) => {
    const phoneCheckbox = page.locator("#acceptPhone");
    const phoneInput = page.locator("#quote-form input#phone");

    // Case désactivée au départ
    await expect(phoneCheckbox).toBeDisabled();

    // Renseigner un téléphone valide
    await phoneInput.fill("0690123456");
    await expect(phoneCheckbox).toBeEnabled();

    // Effacer le téléphone = la case doit se décocher et se désactiver
    await phoneInput.fill("");
    await expect(phoneCheckbox).toBeDisabled();
  });

  test("soumet le formulaire avec des données valides et affiche le message de succès", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Mock API côté client
    await page.route("**/quotes", (route) => {
      route.fulfill({
        status: 201,
        body: JSON.stringify({
          id: "fake-quote-id",
          message: "Demande de devis créée avec succès",
        }),
        contentType: "application/json",
      });
    });

    // Remplir les champs requis avec des sélecteurs plus spécifiques
    await page.fill("#quote-form input#firstName", "Jean");
    await page.fill("#quote-form input#lastName", "Dupont");
    await page.fill("#quote-form input#email", "jean.dupont@example.com");
    await page.fill("#quote-form input#phone", "0690123456");
    await page.fill(
      "#quote-form textarea#message",
      "Je souhaite un devis pour un portail automatique."
    );
    await page.check("#quote-form input#acceptTerms");

    // Soumettre
    await page.click('#quote-form button[type="submit"]');

    // Attendre le conteneur de succès
    await page.waitForSelector(".quote-success-container", {
      timeout: 10000,
    });

    // Vérifier l'affichage de succès
    await expect(page.getByText("Demande de devis envoyée !")).toBeVisible();
    await expect(
      page.getByText("Nous avons bien reçu votre demande de devis")
    ).toBeVisible();
  });
});
