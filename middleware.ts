// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get("AuthToken")?.value;

  const isLoginPage = pathname === "/admin/login";
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedApiRoute = pathname.startsWith("/api/match/finalize");

  // ১. সংরক্ষিত API রুটের জন্য সেশন/হেডার ভ্যালিডেশন
  if (isProtectedApiRoute) {
    const authHeader = request.headers.get("authorization");
    if (!token && !authHeader) {
      return NextResponse.json(
        { error: "Unauthorized: Admin session missing or expired." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // ২. অ্যাডমিন ওয়েব রুট গার্ড (/admin/*)
  if (isAdminRoute) {
    // লগইন ছাড়া কোনো অ্যাডমিন রুটে প্রবেশের চেষ্টা
    if (!token && !isLoginPage) {
      const loginUrl = new URL("/admin/login", request.url);
      if (pathname !== "/admin") {
        loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
      }
      return NextResponse.redirect(loginUrl);
    }

    // অলরেডি ভ্যালিড সেশন কুকি নিয়ে লগইন পেজে ঢুকলে ড্যাশবোর্ডে রিডাইরেক্ট
    if (token && isLoginPage) {
      const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
      const targetUrl = callbackUrl && callbackUrl.startsWith("/admin") ? callbackUrl : "/admin";
      return NextResponse.redirect(new URL(targetUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/match/finalize",
  ],
};