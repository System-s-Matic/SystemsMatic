import { NextRequest, NextResponse } from "next/server";
import { middleware } from "../middleware";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    next: jest.fn(),
    redirect: jest.fn(),
  },
}));

describe("Middleware", () => {
  let mockRequest: Partial<NextRequest>;
  let mockResponse: Partial<NextResponse>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      headers: {
        get: jest.fn(),
      } as any,
      nextUrl: {
        pathname: "/",
        href: "http://localhost:3000/",
      } as any,
      url: "http://localhost:3000/",
    };

    mockResponse = {
      headers: {
        set: jest.fn(),
      } as any,
    };

    (NextResponse.next as jest.Mock).mockReturnValue(mockResponse);
    (NextResponse.redirect as jest.Mock).mockReturnValue(mockResponse);
  });

  describe("Redirection admin", () => {
    it("devrait rediriger vers /admin si le hostname contient 'admin'", () => {
      (mockRequest.headers!.get as jest.Mock).mockReturnValue(
        "admin.example.com"
      );
      mockRequest.nextUrl!.pathname = "/";

      middleware(mockRequest as NextRequest);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        new URL("/admin", "http://localhost:3000/")
      );
    });

    it("ne devrait pas rediriger si le hostname ne contient pas 'admin'", () => {
      (mockRequest.headers!.get as jest.Mock).mockReturnValue("example.com");
      mockRequest.nextUrl!.pathname = "/";

      middleware(mockRequest as NextRequest);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("ne devrait pas rediriger si le pathname n'est pas '/'", () => {
      (mockRequest.headers!.get as jest.Mock).mockReturnValue(
        "admin.example.com"
      );
      mockRequest.nextUrl!.pathname = "/other-page";

      middleware(mockRequest as NextRequest);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe("Protection des pages admin", () => {
    it("devrait ajouter des headers de sécurité pour les pages admin", () => {
      (mockRequest.headers!.get as jest.Mock).mockReturnValue("example.com");
      mockRequest.nextUrl!.pathname = "/admin/dashboard";

      middleware(mockRequest as NextRequest);

      expect(mockResponse.headers!.set).toHaveBeenCalledWith(
        "X-Robots-Tag",
        "noindex, nofollow, noarchive, nosnippet, noimageindex"
      );
      expect(mockResponse.headers!.set).toHaveBeenCalledWith(
        "Cache-Control",
        "no-cache, no-store, must-revalidate"
      );
      expect(mockResponse.headers!.set).toHaveBeenCalledWith(
        "Pragma",
        "no-cache"
      );
      expect(mockResponse.headers!.set).toHaveBeenCalledWith("Expires", "0");
    });

    it("ne devrait pas ajouter de headers pour les pages non-admin", () => {
      (mockRequest.headers!.get as jest.Mock).mockReturnValue("example.com");
      mockRequest.nextUrl!.pathname = "/normal-page";

      middleware(mockRequest as NextRequest);

      expect(mockResponse.headers!.set).not.toHaveBeenCalled();
    });
  });

  describe("Gestion des hostnames", () => {
    it("devrait gérer un hostname vide", () => {
      (mockRequest.headers!.get as jest.Mock).mockReturnValue("");
      mockRequest.nextUrl!.pathname = "/";

      middleware(mockRequest as NextRequest);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("devrait gérer un hostname null", () => {
      (mockRequest.headers!.get as jest.Mock).mockReturnValue(null);
      mockRequest.nextUrl!.pathname = "/";

      middleware(mockRequest as NextRequest);

      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });
});
