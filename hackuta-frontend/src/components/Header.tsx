"use client";

import { useState, useEffect } from "react";
import { getCurrentUser, logout, getLoginUrl, type User } from "@/lib/api";

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-8 lg:px-12">
        <a href="/" className="flex items-center gap-2">
          <span className="font-heading text-2xl font-bold text-navy">
            AdSett
          </span>
        </a>

        <nav className="flex items-center gap-6">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-slate-200"></div>
          ) : user ? (
            <>
              <a
                href="/dashboard"
                className="text-sm font-medium text-slate-700 transition-colors hover:text-accent"
              >
                Dashboard
              </a>
              <button
                onClick={() => logout()}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <a
                href={getLoginUrl()}
                className="text-sm font-medium text-slate-700 transition-colors hover:text-accent"
              >
                Log In
              </a>
              <a
                href={getLoginUrl()}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Sign Up
              </a>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
