import type { NextRequest } from "next/server";

// No middleware needed - authentication is handled by backend
export async function middleware(request: NextRequest) {
  return;
}

export const config = {
  matcher: [],
};
