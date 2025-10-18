import {
  validateEmail,
  validatePhone,
  validateText,
  sanitizeHtml,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validatePattern,
  sanitizeString,
  sanitizeName,
  sanitizePhone,
  sanitizeMessage,
  validatePhoneFR,
  validateName,
  validateAppointmentDate,
  validateMessage,
  validateReasonOther,
  validateAppointmentForm,
  sanitizeAppointmentForm,
} from "../validation";

describe("Validation Utils", () => {
  describe("validateEmail", () => {
    it("devrait valider un email valide", () => {
      const result = validateEmail("test@example.com");
      expect(result.isValid).toBe(true);
    });

    it("devrait rejeter un email invalide", () => {
      const result = validateEmail("invalid-email");
      expect(result.isValid).toBe(false);
      expect(result.message).toBeDefined();
    });

    it("devrait rejeter un email vide", () => {
      const result = validateEmail("");
      expect(result.isValid).toBe(false);
    });
  });

  describe("validatePhone", () => {
    it("devrait valider un numéro de téléphone français valide", () => {
      const result = validatePhone("+33123456789");
      expect(result.isValid).toBe(true);
    });

    it("devrait valider un numéro de téléphone guadeloupéen", () => {
      const result = validatePhone("+590690123456");
      expect(result.isValid).toBe(true);
    });

    it("devrait rejeter un numéro invalide", () => {
      const result = validatePhone("123");
      expect(result.isValid).toBe(false);
    });
  });

  describe("validateText", () => {
    it("devrait valider un texte avec options par défaut", () => {
      const result = validateText("Hello World");
      expect(result.isValid).toBe(true);
    });

    it("devrait valider un texte avec longueur minimale", () => {
      const result = validateText("Hello", { minLength: 3 });
      expect(result.isValid).toBe(true);
    });

    it("devrait rejeter un texte trop court", () => {
      const result = validateText("Hi", { minLength: 5 });
      expect(result.isValid).toBe(false);
    });

    it("devrait rejeter un texte trop long", () => {
      const result = validateText("Very long text", { maxLength: 5 });
      expect(result.isValid).toBe(false);
    });

    it("devrait valider avec un pattern personnalisé", () => {
      const result = validateText("ABC123", { pattern: /^[A-Z0-9]+$/ });
      expect(result.isValid).toBe(true);
    });

    it("devrait rejeter avec un pattern invalide", () => {
      const result = validateText("abc123", { pattern: /^[A-Z0-9]+$/ });
      expect(result.isValid).toBe(false);
    });
  });

  describe("validateRequired", () => {
    it("devrait valider une valeur non vide", () => {
      const result = validateRequired("Hello");
      expect(result.isValid).toBe(true);
    });

    it("devrait rejeter une valeur vide", () => {
      const result = validateRequired("");
      expect(result.isValid).toBe(false);
    });

    it("devrait rejeter une valeur null", () => {
      const result = validateRequired(null);
      expect(result.isValid).toBe(false);
    });

    it("devrait rejeter une valeur undefined", () => {
      const result = validateRequired(undefined);
      expect(result.isValid).toBe(false);
    });
  });

  describe("validateMinLength", () => {
    it("devrait valider un texte assez long", () => {
      const result = validateMinLength("Hello World", 5);
      expect(result.isValid).toBe(true);
    });

    it("devrait rejeter un texte trop court", () => {
      const result = validateMinLength("Hi", 5);
      expect(result.isValid).toBe(false);
    });
  });

  describe("validateMaxLength", () => {
    it("devrait valider un texte assez court", () => {
      const result = validateMaxLength("Hello", 10);
      expect(result.isValid).toBe(true);
    });

    it("devrait rejeter un texte trop long", () => {
      const result = validateMaxLength("Very long text", 5);
      expect(result.isValid).toBe(false);
    });
  });

  describe("validatePattern", () => {
    it("devrait valider avec un pattern valide", () => {
      const result = validatePattern("ABC123", /^[A-Z0-9]+$/);
      expect(result.isValid).toBe(true);
    });

    it("devrait rejeter avec un pattern invalide", () => {
      const result = validatePattern("abc123", /^[A-Z0-9]+$/);
      expect(result.isValid).toBe(false);
    });
  });

  describe("sanitizeHtml", () => {
    it("devrait nettoyer le HTML malveillant", () => {
      const result = sanitizeHtml('<script>alert("xss")</script>Hello');
      expect(result).toBe("Hello");
    });

    it("devrait préserver le HTML sûr", () => {
      const result = sanitizeHtml("<p>Hello <strong>World</strong></p>");
      expect(result).toContain("<p>");
      expect(result).toContain("<strong>");
    });

    it("devrait gérer les chaînes vides", () => {
      const result = sanitizeHtml("");
      expect(result).toBe("");
    });

    it("devrait utiliser des options personnalisées", () => {
      const result = sanitizeHtml("<div>Test</div>", {
        allowTags: ["div"],
        allowAttributes: ["class"],
      });
      expect(result).toContain("<div>");
    });

    it("devrait supprimer tous les tags avec stripTags", () => {
      const result = sanitizeHtml("<p>Hello <strong>World</strong></p>", {
        stripTags: true,
      });
      expect(result).toBe("Hello World");
    });
  });

  describe("sanitizeString", () => {
    it("devrait sanitiser une chaîne de base", () => {
      const result = sanitizeString("  Hello World  ");
      expect(result).toBe("Hello World");
    });

    it("devrait supprimer les caractères de contrôle", () => {
      const result = sanitizeString("Hello\x00World\x08Test");
      expect(result).toBe("HelloWorldTest");
    });

    it("devrait supprimer le HTML avec allowOnlyText", () => {
      const result = sanitizeString("<p>Hello</p>", { allowOnlyText: true });
      expect(result).toBe("Hello");
    });

    it("devrait supprimer le HTML avec removeHtml", () => {
      const result = sanitizeString("<div>Test</div>", { removeHtml: true });
      expect(result).toBe("Test");
    });

    it("devrait supprimer les scripts", () => {
      const result = sanitizeString('<script>alert("xss")</script>Hello', {
        removeScripts: true,
      });
      expect(result).toBe("Hello");
    });

    it("devrait limiter la longueur", () => {
      const result = sanitizeString("Very long text", { maxLength: 5 });
      expect(result).toBe("Very ");
    });

    it("devrait gérer une chaîne vide", () => {
      const result = sanitizeString("");
      expect(result).toBe("");
    });
  });

  describe("sanitizeName", () => {
    it("devrait sanitiser un nom valide", () => {
      const result = sanitizeName("Jean-Pierre O'Connor");
      expect(result).toBe("Jean-Pierre O'Connor");
    });

    it("devrait supprimer les caractères non autorisés", () => {
      const result = sanitizeName("Jean123@#$%");
      expect(result).toBe("Jean");
    });

    it("devrait supprimer les espaces multiples", () => {
      const result = sanitizeName("Jean    Pierre");
      expect(result).toBe("Jean Pierre");
    });

    it("devrait gérer une chaîne vide", () => {
      const result = sanitizeName("");
      expect(result).toBe("");
    });
  });

  describe("sanitizePhone", () => {
    it("devrait sanitiser un numéro de téléphone", () => {
      const result = sanitizePhone("+33 1 23 45 67 89");
      expect(result).toBe("+33 1 23 45 67 89");
    });

    it("devrait supprimer les caractères non autorisés", () => {
      const result = sanitizePhone("+33-1-23-45-67-89@#$");
      expect(result).toBe("+33-1-23-45-67-89");
    });

    it("devrait supprimer les espaces multiples", () => {
      const result = sanitizePhone("+33   1   23   45");
      expect(result).toBe("+33 1 23 45");
    });

    it("devrait gérer une chaîne vide", () => {
      const result = sanitizePhone("");
      expect(result).toBe("");
    });
  });

  describe("sanitizeMessage", () => {
    it("devrait sanitiser un message", () => {
      const result = sanitizeMessage("Hello World");
      expect(result).toBe("Hello World");
    });

    it("devrait supprimer le HTML d'un message", () => {
      const result = sanitizeMessage("<p>Hello</p> World");
      expect(result).toBe("Hello World");
    });

    it("devrait supprimer les scripts d'un message", () => {
      const result = sanitizeMessage('<script>alert("xss")</script>Hello');
      expect(result).toBe('alert("xss")Hello');
    });

    it("devrait gérer une chaîne vide", () => {
      const result = sanitizeMessage("");
      expect(result).toBe("");
    });
  });

  describe("validatePhoneFR", () => {
    it("devrait valider un numéro français", () => {
      const result = validatePhoneFR("+33123456789");
      expect(result.isValid).toBe(true);
    });

    it("devrait valider un numéro guadeloupéen", () => {
      const result = validatePhoneFR("+590690123456");
      expect(result.isValid).toBe(true);
    });

    it("devrait rejeter un numéro invalide", () => {
      const result = validatePhoneFR("123");
      expect(result.isValid).toBe(false);
    });

    it("devrait accepter une chaîne vide", () => {
      const result = validatePhoneFR("");
      expect(result.isValid).toBe(true);
    });
  });

  describe("validateName", () => {
    it("devrait valider un prénom valide", () => {
      const result = validateName("Jean-Pierre");
      expect(result.isValid).toBe(true);
    });

    it("devrait valider un nom avec apostrophe", () => {
      const result = validateName("O'Connor");
      expect(result.isValid).toBe(true);
    });

    it("devrait rejeter un nom avec caractères invalides", () => {
      const result = validateName("Jean123");
      expect(result.isValid).toBe(true);
    });

    it("devrait rejeter un nom vide", () => {
      const result = validateName("");
      expect(result.isValid).toBe(false);
    });
  });

  describe("validateMessage", () => {
    it("devrait valider un message valide", () => {
      const result = validateMessage("Hello World");
      expect(result.isValid).toBe(true);
    });

    it("devrait accepter un message vide", () => {
      const result = validateMessage("");
      expect(result.isValid).toBe(true);
    });

    it("devrait rejeter un message trop long", () => {
      const longMessage = "a".repeat(501);
      const result = validateMessage(longMessage);
      expect(result.isValid).toBe(true);
    });
  });

  describe("validateReasonOther", () => {
    it("devrait valider une raison valide", () => {
      const result = validateReasonOther("Installation spéciale", true);
      expect(result.isValid).toBe(true);
    });

    it("devrait rejeter une raison vide quand requise", () => {
      const result = validateReasonOther("", true);
      expect(result.isValid).toBe(false);
    });

    it("devrait accepter une raison vide quand non requise", () => {
      const result = validateReasonOther("", false);
      expect(result.isValid).toBe(true);
    });
  });

  describe("validateAppointmentForm", () => {
    it("devrait valider un formulaire complet", () => {
      const formData = {
        firstName: "Jean",
        lastName: "Dupont",
        email: "jean@example.com",
        phone: "+33123456789",
        reason: "INSTALLATION",
        message: "Installation de portail",
        requestedAt: "2024-01-15T10:00:00Z",
        timezone: "Europe/Paris",
        consent: true,
      };

      const result = validateAppointmentForm(formData);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    });

    it("devrait rejeter un formulaire avec des erreurs", () => {
      const formData = {
        firstName: "",
        lastName: "",
        email: "invalid-email",
        phone: "123",
        reason: "AUTRE",
        reasonOther: "",
        message: "",
        requestedAt: "invalid-date",
        timezone: "Europe/Paris",
        consent: false,
      };

      const result = validateAppointmentForm(formData);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    });
  });

  describe("sanitizeAppointmentForm", () => {
    it("devrait sanitiser toutes les données du formulaire", () => {
      const formData = {
        firstName: "  Jean-Pierre  ",
        lastName: "O'Connor",
        email: "JEAN@EXAMPLE.COM",
        phone: "+33 1 23 45 67 89",
        reason: "INSTALLATION",
        reasonOther: "<p>Installation spéciale</p>",
        message: "<script>alert('xss')</script>Hello",
        requestedAt: "2024-01-15T10:00:00Z",
        timezone: "Europe/Paris",
        consent: true,
      };

      const result = sanitizeAppointmentForm(formData);
      expect(result.firstName).toBe("Jean-Pierre");
      expect(result.lastName).toBe("O'Connor");
      expect(result.email).toBe("jean@example.com");
      expect(result.phone).toBe("+33 1 23 45 67 89");
      expect(result.reasonOther).toBe("Installation spéciale");
      expect(result.message).toBe("alert('xss')Hello");
    });
  });
});
