import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/config";
import { verifySessionToken } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const isLogin = request.nextUrl.pathname === "/login";
  const authed = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);

  if (!authed && !isLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (authed && isLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
