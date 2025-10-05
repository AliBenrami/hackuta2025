"use client";

import Link from "next/link";
import { useEffect } from "react";

import { LoginMenu } from "@/components/LoginMenu";
import { useAuth } from "@/context/AuthContext";

export default function SignupPage() {
  const { signup, user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      window.location.replace("/dashboard");
    }
  }, [user]);

  return (
    <div className="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 lg:grid-cols-2">
      <div className="relative hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-sky-500 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ffffff22,transparent_55%)]" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest">
              Create Your Workspace
            </span>
            <h1 className="mt-8 text-4xl font-heading font-semibold">Start shipping smarter ads.</h1>
            <p className="mt-4 text-sm text-white/80">
              Launch your creative pipeline with AI feedback, instant publishing, and performance insight loops.
            </p>
          </div>
          <div className="space-y-4 text-sm text-white/70">
            <p>• Quick Auth0 onboarding flow</p>
            <p>• Connect your marketing stack in minutes</p>
            <p>• Collaborate across campaigns with ease</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center space-y-10 p-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-heading font-semibold text-navy">
            AdSett
            <span className="text-accent">.</span>
          </Link>
          <LoginMenu />
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-heading font-semibold text-navy">Sign up</h2>
            <p className="mt-2 text-sm text-slate-600">
              We&apos;ll redirect you to Auth0 to finish creating your secure account.
            </p>
          </div>

          <button
            type="button"
            onClick={signup}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? "Checking session…" : "Continue with Auth0"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-accent transition hover:text-accent-hover">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

