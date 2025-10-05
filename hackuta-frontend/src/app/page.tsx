"use client";

import { useState, useEffect } from "react";
import {
  getCurrentUser,
  getLoginUrl,
  getLogoutUrl,
  type User,
} from "@/lib/api";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="font-sans min-h-screen p-8 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen p-8">
      <nav className="flex justify-between items-center mb-12 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold">Adssent.</h2>
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <a
                href="/profile"
                className="hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                  </span>
                </div>
              </a>
              <a href={getLogoutUrl()} className="text-sm hover:underline">
                Logout
              </a>
            </>
          ) : (
            <a href={getLoginUrl()} className="text-sm hover:underline">
              Login
            </a>
          )}
        </div>
      </nav>

      <main className="flex flex-col gap-8 items-center max-w-4xl mx-auto">
        {!user ? (
          <div className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Please log in to continue
            </p>
            <a
              href={getLoginUrl()}
              className="inline-flex rounded-full border border-solid border-transparent transition-colors items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm h-10 px-6"
            >
              Login with Auth0
            </a>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">
              Welcome back, {user.name || user.email}!
            </h1>
            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mx-auto">
              <span className="text-2xl font-medium">
                {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            <div className="flex gap-4 justify-center">
              <a
                href="/profile"
                className="inline-flex rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] font-medium text-sm h-10 px-6"
              >
                View Profile
              </a>
              <a
                href={getLogoutUrl()}
                className="inline-flex rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] font-medium text-sm h-10 px-6"
              >
                Logout
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
