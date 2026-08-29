// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { authMiddleware, redirectToLogin } from "next-firebase-auth-edge";

// যে পেজগুলো পাবলিক দর্শকরা দেখবে
const PUBLIC_PATHS = ['/', '/live', '/match-history'];

export async function middleware(request: NextRequest) {
  return authMiddleware(request, {
    loginPath: "/api/login",
    logoutPath: "/api/logout",
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    cookieName: "AuthToken",
    cookieSignatureKeys: [process.env.COOKIE_SECRET_CURRENT!],
    cookieSerializeOptions: {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // প্রোডাকশনে secure হবে
      sameSite: "lax" as const,
      maxAge: 12 * 60 * 60 * 24, // ১২ দিন সেশন থাকবে
    },
    serviceAccount: {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      // env ফাইল থেকে \n গুলো ঠিকমতো পার্স করার জন্য
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
    },
    handleValidToken: async ({ token, decodedToken }, headers) => {
      // টোকেন ভ্যালিড হলে এডমিন রাউটে ঢুকতে দেবে
      return NextResponse.next({
        request: { headers }
      });
    },
    handleInvalidToken: async (reason) => {
      // যদি ইউজার /admin-এর কোনো রাউটে (লগইন ছাড়া) ঢুকতে চায়, তাকে লগইনে পাঠিয়ে দেবে
      if (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') {
        return redirectToLogin(request, {
          path: '/admin/login',
          publicPaths: PUBLIC_PATHS
        });
      }
      return NextResponse.next();
    },
    handleError: async (error) => {
      console.error('Unhandled authentication error', { error });
      if (request.nextUrl.pathname.startsWith('/admin') && request.nextUrl.pathname !== '/admin/login') {
        return redirectToLogin(request, {
          path: '/admin/login',
          publicPaths: PUBLIC_PATHS
        });
      }
      return NextResponse.next();
    }
  });
}

// Next.js-কে বলে দেওয়া কোন কোন রাউটে এই মিডলওয়্যার রান করবে
export const config = {
  matcher: [
    "/api/login",
    "/api/logout",
    "/",
    "/((?!_next|favicon.ico|api/scorecard|.*\\.).*)",
    "/admin/(.*)",
  ],
};