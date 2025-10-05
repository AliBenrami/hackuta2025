"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-700">Loading...</p>
          <p className="mt-2 text-sm text-slate-500">
            Authenticating your session, please wait.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
