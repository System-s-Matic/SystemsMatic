import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminLogin from "../AdminLogin";
import { authApi } from "@/lib/auth-api";
import { showSuccess, showError } from "@/lib/toast";

// Mock des dépendances
jest.mock("@/lib/auth-api");
jest.mock("@/lib/toast");

const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockedShowSuccess = showSuccess as jest.MockedFunction<
  typeof showSuccess
>;
const mockedShowError = showError as jest.MockedFunction<typeof showError>;

describe("AdminLogin", () => {
  const mockOnLoginSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("devrait afficher le formulaire de connexion", () => {
    render(<AdminLogin onLoginSuccess={mockOnLoginSuccess} />);

    expect(screen.getByText("Connexion Administrateur")).toBeInTheDocument();
    expect(
      screen.getByText("Veuillez vous connecter pour accéder au backoffice")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Se connecter" })
    ).toBeInTheDocument();
  });

  it("devrait mettre à jour les champs email et mot de passe", () => {
    render(<AdminLogin onLoginSuccess={mockOnLoginSuccess} />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Mot de passe");

    fireEvent.change(emailInput, { target: { value: "admin@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(emailInput).toHaveValue("admin@test.com");
    expect(passwordInput).toHaveValue("password123");
  });

  it("devrait appeler onLoginSuccess après une connexion réussie", async () => {
    const mockUser = {
      id: "1",
      email: "admin@test.com",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockedAuthApi.login.mockResolvedValue({
      user: mockUser,
      message: "Connexion réussie",
    });

    render(<AdminLogin onLoginSuccess={mockOnLoginSuccess} />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Mot de passe");
    const submitButton = screen.getByRole("button", { name: "Se connecter" });

    fireEvent.change(emailInput, { target: { value: "admin@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockedAuthApi.login).toHaveBeenCalledWith({
        email: "admin@test.com",
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(mockOnLoginSuccess).toHaveBeenCalledWith(mockUser);
    });

    expect(mockedShowSuccess).toHaveBeenCalledWith("Connexion réussie !");
  });

  it("devrait afficher une erreur en cas d'échec de connexion", async () => {
    const mockError = {
      response: {
        data: {
          message: "Identifiants invalides",
        },
      },
    };
    mockedAuthApi.login.mockRejectedValue(mockError);

    render(<AdminLogin onLoginSuccess={mockOnLoginSuccess} />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Mot de passe");
    const submitButton = screen.getByRole("button", { name: "Se connecter" });

    fireEvent.change(emailInput, { target: { value: "admin@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Identifiants invalides")).toBeInTheDocument();
    });

    expect(mockedShowError).toHaveBeenCalledWith("Identifiants invalides");
    expect(mockOnLoginSuccess).not.toHaveBeenCalled();
  });

  it("devrait afficher un message d'erreur générique en cas d'erreur sans message", async () => {
    const mockError = new Error("Network error");
    mockedAuthApi.login.mockRejectedValue(mockError);

    render(<AdminLogin onLoginSuccess={mockOnLoginSuccess} />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Mot de passe");
    const submitButton = screen.getByRole("button", { name: "Se connecter" });

    fireEvent.change(emailInput, { target: { value: "admin@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Erreur de connexion")).toBeInTheDocument();
    });

    expect(mockedShowError).toHaveBeenCalledWith("Erreur de connexion");
  });

  it("devrait afficher l'état de chargement pendant la connexion", async () => {
    mockedAuthApi.login.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<AdminLogin onLoginSuccess={mockOnLoginSuccess} />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Mot de passe");
    const submitButton = screen.getByRole("button", { name: "Se connecter" });

    fireEvent.change(emailInput, { target: { value: "admin@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    expect(screen.getByText("Connexion...")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText("Se connecter")).toBeInTheDocument();
    });
  });

  it("devrait réinitialiser le formulaire après une connexion réussie", async () => {
    const mockUser = {
      id: "1",
      email: "admin@test.com",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockedAuthApi.login.mockResolvedValue({
      user: mockUser,
      message: "Connexion réussie",
    });

    render(<AdminLogin onLoginSuccess={mockOnLoginSuccess} />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Mot de passe");
    const submitButton = screen.getByRole("button", { name: "Se connecter" });

    fireEvent.change(emailInput, { target: { value: "admin@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toHaveValue("");
      expect(passwordInput).toHaveValue("");
    });
  });

  it("devrait empêcher la soumission du formulaire si les champs sont vides", () => {
    render(<AdminLogin onLoginSuccess={mockOnLoginSuccess} />);

    const submitButton = screen.getByRole("button", { name: "Se connecter" });
    fireEvent.click(submitButton);

    expect(mockedAuthApi.login).not.toHaveBeenCalled();
  });
});
