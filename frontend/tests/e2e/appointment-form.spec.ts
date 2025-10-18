import { test, expect, Page, Route } from "@playwright/test";

test.describe("Formulaire de rendez-vous — Page d'accueil", () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Interception de la requête POST vers l'API
    await page.route("**/*appointments*", async (route: Route) => {
      console.log("Intercepted request:", route.request().url());
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "fake-appointment-id",
          message: "Rendez-vous créé avec succès",
        }),
      });
    });

    await page.goto("/");
  });

  test("soumet un formulaire valide et affiche le message de succès", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Renseigner les champs obligatoires
    await page.fill("input#firstName", "Jean");
    await page.fill("input#lastName", "Dupont");
    await page.fill("input#email", "jean.dupont@example.com");
    await page.fill("input#phone", "0690123456");

    // Sélection d'un motif (exemple : Installation)
    await page.selectOption('select[name="reason"]', { label: "Installation" });

    // Sélectionner une date valide (demain)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10); // YYYY-MM-DD

    // Remplir le champ date
    await page.fill("input#date-picker", dateStr);

    // Sélectionner une heure (8h00)
    await page.selectOption("select#time-picker", "08:00");

    // Attendre un petit instant que la valeur soit propagée à React Hook Form
    await page.waitForTimeout(300);

    // Consentement RGPD si présent
    const consentCheckbox = page.locator(
      'input[type="checkbox"][name="consent"]'
    );
    if (await consentCheckbox.count()) {
      await consentCheckbox.check();
    }

    // Attendre un peu pour s'assurer que tous les champs sont remplis
    await page.waitForTimeout(500);

    // Soumission
    await page.click('#appointment-form button[type="submit"]');

    // Attendre que le message de succès apparaisse (remplace le formulaire)
    await page.waitForSelector(".success-container", { timeout: 10000 });

    // Vérification du succès
    await expect(page.locator("h2.success-title")).toBeVisible();
    await expect(page.locator("h2.success-title")).toContainText(
      "Demande envoyée avec succès !"
    );
    await expect(
      page.getByText("Vous recevrez bientôt un email de confirmation")
    ).toBeVisible();
  });

  test("affiche les erreurs de validation si le formulaire est incomplet", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Cliquer sur le bouton de soumission sans remplir le formulaire
    await page.click('#appointment-form button[type="submit"]');

    // Attendre que le toast d'erreur apparaisse
    await page.waitForSelector(".Toastify__toast--error", { timeout: 5000 });

    // Vérifier que le toast d'erreur contient le bon message
    await expect(page.locator(".Toastify__toast--error")).toContainText(
      "Veuillez corriger les erreurs dans le formulaire"
    );

    // Attendre que les messages d'erreur sous les champs apparaissent
    await page.waitForSelector("p.form-error", { timeout: 5000 });

    // Vérifier que les messages d'erreur sont présents
    const errorMessages = page.locator("p.form-error");
    await expect(errorMessages).toHaveCount(5); // Prénom, nom, email, date/heure, consent manquants

    // Vérifier le contenu des messages d'erreur
    await expect(errorMessages).toContainText([
      "Le prénom est requis",
      "Le nom est requis",
      "L'email est requis",
      "La date et l'heure sont requises",
      "Vous devez accepter les conditions",
    ]);
  });

  test("affiche les erreurs de validation si le formulaire est partiellement rempli", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Remplir seulement le prénom
    await page.fill("input#firstName", "Jean");

    // Cliquer sur le bouton de soumission
    await page.click('#appointment-form button[type="submit"]');

    // Attendre que le toast d'erreur apparaisse
    await page.waitForSelector(".Toastify__toast--error", { timeout: 5000 });

    // Vérifier que le toast d'erreur contient le bon message
    await expect(page.locator(".Toastify__toast--error")).toContainText(
      "Veuillez corriger les erreurs dans le formulaire"
    );

    // Attendre que les messages d'erreur sous les champs apparaissent
    await page.waitForSelector("p.form-error", { timeout: 5000 });

    // Vérifier que les messages d'erreur sont présents
    const errorMessages = page.locator("p.form-error");
    await expect(errorMessages).toHaveCount(4); // Nom, email, date/heure, consent manquants

    // Vérifier le contenu des messages d'erreur
    await expect(errorMessages).toContainText([
      "Le nom est requis",
      "L'email est requis",
      "La date et l'heure sont requises",
      "Vous devez accepter les conditions",
    ]);
  });
});
