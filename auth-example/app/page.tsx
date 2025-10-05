"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  getCurrentUser,
  getLoginUrl,
  logout,
  setSessionToken,
  type User,
} from "@/lib/api";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const initAuth = async () => {
      // Check if we have a token in URL (from OAuth callback)
      const token = searchParams.get("token");
      if (token) {
        console.log("DEBUG: Token found in URL, storing it");
        console.log("DEBUG: Token value:", token.substring(0, 50) + "...");
        setSessionToken(token);

        // Verify it was stored
        const storedToken = localStorage.getItem("session_token");
        console.log(
          "DEBUG: Verification - token in localStorage:",
          storedToken ? "YES" : "NO"
        );

        // Remove token from URL
        window.history.replaceState({}, "", "/");
      } else {
        console.log("DEBUG: No token in URL, checking localStorage");
        const storedToken = localStorage.getItem("session_token");
        console.log(
          "DEBUG: Token in localStorage:",
          storedToken ? "YES" : "NO"
        );
      }

      // Fetch current user
      const userData = await getCurrentUser();
      console.log("DEBUG: User data:", userData ? "FOUND" : "NULL");
      setUser(userData);
      setLoading(false);
    };

    initAuth();
  }, [searchParams]);

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
              <button
                onClick={() => logout()}
                className="text-sm hover:underline cursor-pointer"
              >
                Logout
              </button>
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
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm font-medium">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Not Logged In
            </div>
            <h1 className="text-4xl font-bold">Welcome to Adssent</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Please log in to access your account
            </p>
            <a
              href={getLoginUrl()}
              className="inline-flex rounded-full border border-solid border-transparent transition-colors items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm h-12 px-8"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Login with Auth0
            </a>
          </div>
        ) : (
          <div className="w-full space-y-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Logged In
              </div>
              <h1 className="text-4xl font-bold">
                Welcome back, {user.name || user.email}!
              </h1>
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mx-auto shadow-lg">
                <span className="text-3xl font-bold text-white">
                  {user.name?.charAt(0).toUpperCase() ||
                    user.email?.charAt(0).toUpperCase() ||
                    "U"}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {user.email}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold mb-4">
                Account Information
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    Name:
                  </span>
                  <span className="font-medium">{user.name || "Not set"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">
                    Email:
                  </span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    User ID:
                  </span>
                  <span className="font-mono text-sm text-gray-500 dark:text-gray-500">
                    {user.sub}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <a
                href="/profile"
                className="inline-flex rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] font-medium text-sm h-12 px-6 gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                View Full Profile
              </a>
              <button
                onClick={() => logout()}
                className="inline-flex rounded-full border border-solid border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 transition-colors items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 font-medium text-sm h-12 px-6 gap-2 cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
