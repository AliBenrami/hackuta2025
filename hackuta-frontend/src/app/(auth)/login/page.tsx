"use client";

import Link from "next/link";
import { useEffect } from "react";

import { LoginMenu } from "@/components/LoginMenu";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login, user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      window.location.replace("/dashboard");
    }
  }, [user]);

  return (
    <div className="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 lg:grid-cols-2">
      <div className="relative hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ffffff22,transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest">
              Secure Access
            </span>
            <h1 className="mt-8 text-4xl font-heading font-semibold">Welcome back to Adsett.</h1>
            <p className="mt-4 text-sm text-white/80">
              Analyze creatives, get AI feedback, and publish to your channels in one streamlined workspace.
            </p>
          </div>
          <div className="space-y-4 text-sm text-white/70">
            <p>• OAuth-secured access via Auth0</p>
            <p>• Session persistence across devices</p>
            <p>• Built for teams shipping campaigns fast</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center space-y-10 p-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-heading font-semibold text-navy">
            Adsett
            <span className="text-accent">.</span>
          </Link>
          <LoginMenu />
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-heading font-semibold text-navy">Log in</h2>
            <p className="mt-2 text-sm text-slate-600">
              Use your Auth0-powered credentials to continue to your dashboard.
            </p>
          </div>

          <button
            type="button"
            onClick={login}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? "Checking session…" : "Continue with Auth0"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-accent transition hover:text-accent-hover">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

