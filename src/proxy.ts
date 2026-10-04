import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAME = process.env.COOKIE_NAME ?? "violetchat_token";
const PUBLIC_AUTH_PATHS = new Set(["/login", "/register"]);

// Lightweight, request-time redirect guard (Next.js 16 "proxy" convention,
// the successor to middleware.ts). This only checks for the presence of the
// auth cookie. Full JWT verification (signature + expiry) happens in API
// routes and the Socket.IO handshake, which run in the Node.js runtime.
export function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  const isAuthPath = PUBLIC_AUTH_PATHS.has(pathname);

  if (!token && pathname.startsWith("/chat")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isAuthPath) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/login", "/register"],
};
