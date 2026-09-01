// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get("AuthToken")?.value;

  const isLoginPage = pathname === "/admin/login";
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedApiRoute = pathname.startsWith("/api/match/finalize");

  // ১. সংরক্ষিত API রুটের জন্য অথেন্টিকেশন চেক
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
    // লগইন করা না থাকলে এবং ইউজার লগইন পেজে না থাকলে
    if (!token && !isLoginPage) {
      const loginUrl = new URL("/admin/login", request.url);
      // লগইনের পর যাতে সরাসরি কাঙ্ক্ষিত পেজে (যেমন: /admin/control) ফিরে যেতে পারে
      if (pathname !== "/admin") {
        loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
      }
      return NextResponse.redirect(loginUrl);
    }

    // অলরেডি লগইন থাকা অবস্থায় লগইন পেজে ঢুকলে ড্যাশবোর্ডে রিডাইরেক্ট করবে
    if (token && isLoginPage) {
      const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
      const targetUrl = callbackUrl && callbackUrl.startsWith("/admin") ? callbackUrl : "/admin";
      return NextResponse.redirect(new URL(targetUrl, request.url));
    }
  }

  return NextResponse.next();
}

// যে যে রুটে মিডলওয়্যার সক্রিয় থাকবে
export const config = {
  matcher: [
    "/admin/:path*",
    "/api/match/finalize",
  ],
};