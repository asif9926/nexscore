import { NextRequest, NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    let idToken: string | null = null;

    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      idToken = authHeader.substring(7).trim();
    }

    if (!idToken) {
      try {
        const body = await request.json();
        idToken = body?.idToken || null;
      } catch {
        // Body parsing fallback
      }
    }

    if (!idToken) {
      return NextResponse.json({ success: false, error: "Token is missing" }, { status: 400 });
    }

    const authAdmin = getAuth(getAdminApp());

    // ১৪ দিনের সর্বোচ্চ মেয়াদ (Firebase Session Cookie Max Limit)
    const expiresIn = 14 * 24 * 60 * 60 * 1000;
    const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ success: true });

    response.cookies.set("AuthToken", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Session Cookie Error:", err);
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
}