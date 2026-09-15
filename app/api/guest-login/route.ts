import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const cookieStore = await cookies();

  // Set a temporary guest cookie valid for 1 day (or whatever duration you prefer)
  cookieStore.set("guest_mode", "true", {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 1 day
    sameSite: "lax",
  });

  // Redirect to homepage or library
  return NextResponse.redirect(new URL("/", request.url), {
    status: 303,
  });
}