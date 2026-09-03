// app/api/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("AuthToken")?.value;

    // 🛡️ ফায়ারবেস অথেনটিকেশনে সেশন ও রিফ্রেশ টোকেন রিভোক করা
    if (sessionCookie) {
      try {
        const decoded = await adminAuth.verifySessionCookie(sessionCookie);
        if (decoded?.sub) {
          await adminAuth.revokeRefreshTokens(decoded.sub);
        }
      } catch {
        // সেশন পূর্বে এক্সপায়ার হয়ে থাকলে ইগনোর করবে
      }
    }

    cookieStore.delete("AuthToken");

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    
    response.cookies.set("AuthToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error("Logout API Error:", error);
    return NextResponse.json({ success: false, error: "Failed to clear session" }, { status: 500 });
  }
}