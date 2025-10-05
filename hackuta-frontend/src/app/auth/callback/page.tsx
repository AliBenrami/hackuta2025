"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { persistSession } from "@/lib/api";

export default function AuthCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get("token");
      const error = searchParams.get("error");

      if (error) {
        console.error("Auth error:", error);
        router.push("/?error=" + encodeURIComponent(error));
        return;
      }

      if (!token) {
        console.error("No token received");
        router.push("/?error=no_token");
        return;
      }

      try {
        // Persist the session
        await persistSession(token);

        // Redirect to dashboard or home
        router.push("/dashboard");
      } catch (err) {
        console.error("Failed to persist session:", err);
        router.push("/?error=session_failed");
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent mx-auto"></div>
        <p className="text-slate-600">Completing sign in...</p>
      </div>
    </div>
  );
}
