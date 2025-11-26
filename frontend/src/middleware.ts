import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";

  // Rediriger vers l'administration si le domaine contient "admin"
  if (hostname.includes("admin") && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Protection supplémentaire pour les pages d'administration
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Ajouter des headers de sécurité pour empêcher l'indexation
    const response = NextResponse.next();

    response.headers.set(
      "X-Robots-Tag",
      "noindex, nofollow, noarchive, nosnippet, noimageindex"
    );
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};
