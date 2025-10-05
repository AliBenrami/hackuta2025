"use client";

import { useEffect, useState } from "react";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-200/70 bg-surface/80 backdrop-blur-sm shadow-sm"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-8 lg:px-12">
        <a
          href="#hero"
          className="flex items-center gap-2 select-none"
          aria-label="AdSett Home"
        >
          <span className="text-2xl font-heading font-semibold tracking-wide text-navy">AdSett</span>
          <span
            className="ml-1 inline-block h-2 w-2 rounded-full bg-accent"
            aria-hidden="true"
          />
        </a>
        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a className="transition-colors hover:text-navy" href="#features">
            Features
          </a>
          <a className="transition-colors hover:text-navy" href="#workflow">
            Workflow
          </a>
          <a className="transition-colors hover:text-navy" href="#signin">
            Sign In
          </a>
        </div>
        <a
          href="#demo"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-accent-hover"
        >
          Try Demo
        </a>
      </nav>
    </header>
  );
}


