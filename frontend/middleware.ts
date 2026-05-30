import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  const publicPaths = ["/login", "/signup"];
  const isPublic = publicPaths.includes(pathname);

  // Not logged in → trying to access protected page → send to login
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Already logged in → trying to access login/signup → send to apply
  if (token && isPublic) {
    return NextResponse.redirect(new URL("/apply", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
