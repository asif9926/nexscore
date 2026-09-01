// app/api/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // AuthToken কুকি ডিলিট করা
    cookieStore.delete("AuthToken");

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    
    // ব্রাউজারকে নিশ্চিতভাবে কুকি এক্সপায়ার করতে বলা
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