import { NextRequest, NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    let idToken: string | null = null;

    // ১. Authorization Header থেকে টোকেন চেক (Fallback)
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      idToken = authHeader.substring(7).trim();
    }

    // ২. Request Body থেকে টোকেন চেক
    if (!idToken) {
      try {
        const body = await request.json();
        idToken = body?.idToken || null;
      } catch {
        // বডি খালি থাকলে ইগনোর করবে
      }
    }

    // টোকেন না পেলে স্পষ্ট এরর
    if (!idToken) {
      return NextResponse.json(
        { success: false, error: "ID Token is missing from request body/headers." },
        { status: 400 }
      );
    }

    const authAdmin = getAuth(getAdminApp());

    // ৫ দিনের জন্য Firebase Session Cookie তৈরি
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ success: true });

    // Session Cookie সেট করা
    response.cookies.set("AuthToken", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("❌ Session Cookie Creation Error:", err?.message || err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to create Firebase session cookie.",
      },
      { status: 401 }
    );
  }
}