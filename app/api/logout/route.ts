// app/api/logout/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("AuthToken", "", {
    maxAge: 0,
    path: "/",
  });
  return response;
}