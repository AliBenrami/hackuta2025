"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { LoginMenu } from "@/components/LoginMenu";

type HeaderVariant = "marketing" | "dashboard";

interface HeaderProps {
  variant?: HeaderVariant;
  userName?: string | null;
}

export function Header({ variant = "marketing", userName }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const baseClasses = `fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
    scrolled
      ? "border-b border-slate-200/70 bg-surface/80 backdrop-blur-sm shadow-sm"
      : "border-b border-transparent bg-transparent"
  }`;

  if (variant === "dashboard") {
    return (
      <header className={baseClasses}>
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <Link href="/dashboard" className="flex items-center gap-2 select-none" aria-label="AdSett Dashboard">
            <span className="text-2xl font-heading font-semibold tracking-wide text-navy">AdSett</span>
            <span className="ml-1 inline-block h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          </Link>
          <p className="hidden text-sm font-medium text-slate-600 sm:block">
            {userName ? `Welcome back, ${userName}!` : "Loading your workspace…"}
          </p>
          <LoginMenu />
        </nav>
      </header>
    );
  }

  return (
    <header className={baseClasses}>
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-2 select-none" aria-label="AdSett Home">
          <span className="text-2xl font-heading font-semibold tracking-wide text-navy">AdSett</span>
          <span className="ml-1 inline-block h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <Link className="transition-colors hover:text-navy" href="/#features">
            Features
          </Link>
          <Link className="transition-colors hover:text-navy" href="/#workflow">
            Workflow
          </Link>
          <Link className="transition-colors hover:text-navy" href="/signup">
            Sign Up
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-accent-hover"
          >
            Dashboard
          </Link>
          <LoginMenu variant="link" />
        </div>
      </nav>
    </header>
  );
}


