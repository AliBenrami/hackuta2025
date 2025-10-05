"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, logout, type User } from "@/lib/api";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getCurrentUser()
      .then((userData) => {
        if (!userData) {
          // Redirect to login if not authenticated
          window.location.href = "http://localhost:8000/auth/login";
        } else {
          setUser(userData);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="font-sans min-h-screen p-8 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="font-sans min-h-screen p-8">
      <nav className="flex justify-between items-center mb-12 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold">Adssent.</h2>
        <div className="flex gap-4">
          <a href="/" className="text-sm hover:underline">
            Home
          </a>
          <button
            onClick={() => logout()}
            className="text-sm hover:underline cursor-pointer"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
              <span className="text-4xl font-medium">
                {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{user.name || "User"}</h1>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  User ID:
                </span>
                <span className="text-gray-600 dark:text-gray-400 text-sm font-mono">
                  {user.sub}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Name:
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {user.name || "N/A"}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Email:
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  {user.email}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <a
              href="/"
              className="flex-1 text-center rounded-lg border border-solid border-black/[.08] dark:border-white/[.145] transition-colors py-3 hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] font-medium text-sm"
            >
              Back to Home
            </a>
            <button
              onClick={() => logout()}
              className="flex-1 text-center rounded-lg border border-solid border-red-500 text-red-500 transition-colors py-3 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium text-sm cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
