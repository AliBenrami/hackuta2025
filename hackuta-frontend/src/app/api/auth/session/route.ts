import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "session_token";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, maxAge } = body;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });

    // Set session cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: maxAge || 60 * 60 * 24 * 7, // 7 days default
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error setting session cookie:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Clear session cookie
  response.cookies.delete(SESSION_COOKIE_NAME);

  return response;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  return NextResponse.json({ token: token || null });
}
