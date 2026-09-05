// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get("AuthToken")?.value;

  const isLoginPage = pathname === "/admin/login";
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtectedApiRoute = pathname.startsWith("/api/match/finalize");

  // ১. সংরক্ষিত API রুট গার্ড
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

  // ২. অ্যাডমিন রুট গার্ড
  if (isAdminRoute) {
    // লগইন ছাড়া অন্য অ্যাডমিন রুটে প্রবেশের চেষ্টা
    if (!token && !isLoginPage) {
      const loginUrl = new URL("/admin/login", request.url);
      if (pathname !== "/admin") {
        loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
      }
      return NextResponse.redirect(loginUrl);
    }

    // 🛡️ ফিক্সড: ক্লায়েন্ট যদি নিজে থেকে /admin/login এ যেতে চায়, মিডলওয়্যার জোর করে আটকে দেবে না
    // এতে জম্বি সেশন বাউন্স ট্র্যাপ চিরতরে বন্ধ হবে
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/match/finalize",
  ],
};