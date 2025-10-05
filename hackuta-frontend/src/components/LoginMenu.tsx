"use client";

import { Loader2, LogOut, UserRound } from "lucide-react";
import { useMemo } from "react";

import { useAuth } from "@/context/AuthContext";

export function LoginMenu({ variant = "button" }: { variant?: "button" | "link" }) {
  const { user, loading, login, logout } = useAuth();

  const initials = useMemo(() => {
    if (!user) return "";
    const candidates = [user.name, user.email].filter(Boolean) as string[];
    const source = candidates.find(Boolean) ?? "";
    return source
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  }, [user]);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" />
        Loading…
      </span>
    );
  }

  if (!user) {
    if (variant === "link") {
      return (
        <button
          type="button"
          onClick={login}
          className="text-sm font-medium text-accent transition hover:opacity-80"
        >
          Log in
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={login}
        className="inline-flex items-center justify-center rounded-full border border-transparent bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover"
      >
        Log in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
          {initials || <UserRound className="size-4" />}
        </span>
        <span className="hidden sm:inline">{user.name ?? user.email}</span>
      </div>
      <button
        type="button"
        onClick={logout}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        <LogOut className="size-4" />
        Logout
      </button>
    </div>
  );
}

