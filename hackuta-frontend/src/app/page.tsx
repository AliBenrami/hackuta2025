"use client";

import { Header } from "@/components/Header";
import { ScrollHint } from "@/components/ScrollHint";
import { useAuth } from "@/context/AuthContext";
import { getLoginUrl } from "@/lib/api";
import { useRouter } from "next/navigation";
import { JSX, useEffect } from "react";

const features = [
  {
    title: "Upload Creative",
    description: "Centralize assets in seconds with drag-and-drop or API sync.",
    icon: "cloud-upload",
  },
  {
    title: "AI Feedback",
    description:
      "Receive precise critique grounded in performance benchmarks and brand goals.",
    icon: "sparkles",
  },
  {
    title: "Publish & Track",
    description:
      "Ship to X/Twitter instantly and monitor results without leaving Adsett.",
    icon: "chart-bar",
  },
];

const workflowSteps = [
  { key: "Upload", description: "Drop in static or motion creatives." },
  {
    key: "Analyze",
    description: "AI evaluates clarity, tone, and compliance.",
  },
  { key: "Improve", description: "Apply tailored suggestions in one click." },
  { key: "Post", description: "Publish to X/Twitter with approvals baked in." },
  { key: "Track", description: "Loop performance data back into the brief." },
];

function Icon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    "cloud-upload": (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
        <path
          fill="currentColor"
          d="M12 3a6 6 0 0 0-5.856 4.8A5 5 0 0 0 6 21h12a5 5 0 0 0 1.855-9.638 6.001 6.001 0 0 0-7.61-7.359A6 6 0 0 0 12 3Zm-1 9v4a1 1 0 1 0 2 0v-4h1.586a1 1 0 0 0 .707-1.707l-3.293-3.293a1 1 0 0 0-1.414 0L8.293 10.293A1 1 0 0 0 9 12h2Z"
          className="text-accent"
        />
      </svg>
    ),
    sparkles: (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
        <path
          fill="currentColor"
          d="M5 3h2v4h4v2H7v4H5V9H1V7h4V3Zm11-1 1.8 4.2L22 8l-4.2 1.8L16 14l-1.8-4.2L10 8l4.2-1.8L16 2Zm-7.5 9.5 1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2 1.2-2.8Z"
          className="text-accent"
        />
      </svg>
    ),
    "chart-bar": (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
        <path
          fill="currentColor"
          d="M21 19a1 1 0 1 0 0-2h-1v-7a1 1 0 0 0-1-1h-3a1 1 0 0 0-1 1v7h-2v-4a1 1 0 0 0-1-1h-3a1 1 0 0 0-1 1v4H7v-2a1 1 0 0 0-1-1H3a1 1 0 0 0 0 2h2v2a1 1 0 0 0 1 1h16Z"
          className="text-accent"
        />
      </svg>
    ),
  };

  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
      {icons[name]}
    </span>
  );
}

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  // Prevent flash of content while redirecting
  if (isLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-700">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <section id="hero" className="relative flex min-h-screen flex-col">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,#2563EB22,transparent_55%)]" />
        <Header />
        <div className="flex min-h-[80vh] flex-1 flex-col items-center justify-center px-6 text-center sm:px-8 lg:px-12">
          <h1 className="max-w-3xl text-balance font-heading text-4xl font-semibold tracking-tight text-navy sm:text-5xl md:text-6xl">
            Smarter Ads. Sharper Insights.
          </h1>
          <p className="mt-6 max-w-2xl text-balance text-base text-slate-600 sm:text-lg">
            {/* Dummy: hero subtext copy */}
            AI-driven feedback for marketing teams and creators.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            {/* TODO [frontend]: link Demo → /dashboard */}
            <a
              className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-accent-hover"
              href={getLoginUrl()}
            >
              {/* Dummy: placeholder hero CTA */}
              Sign Up
            </a>
            <a
              className="inline-flex items-center justify-center rounded-lg border border-accent bg-white px-6 py-3 text-sm font-semibold text-accent shadow-md shadow-accent/10 transition-colors duration-200 hover:bg-accent/10"
              href={getLoginUrl()}
            >
              {/* Dummy: placeholder hero CTA */}
              Log In
            </a>
          </div>
        </div>
        <ScrollHint />
      </section>

      <section
        id="features"
        className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-8 lg:px-12"
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold text-navy sm:text-4xl">
            Core Intelligence Modules
          </h2>
          <p className="mt-4 text-base text-slate-600">
            {/* Dummy: features section intro copy */}
            Consolidate creative, feedback, and performance data in one
            connected stack for marketing teams that move fast.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-md shadow-slate-300/20 transition-transform duration-200 hover:-translate-y-1 hover:border-accent/60 hover:shadow-lg hover:shadow-accent/15"
            >
              <Icon name={feature.icon} />
              <h3 className="font-heading text-xl text-navy">
                {feature.title}
              </h3>
              <p className="text-sm leading-6 text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="workflow"
        className="w-full bg-white/70 py-24 backdrop-blur-sm"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 sm:px-8 lg:px-12">
          <div className="text-center">
            <h2 className="font-heading text-3xl font-semibold text-navy sm:text-4xl">
              Built for The Creative Feedback Loop
            </h2>
            <p className="mt-4 text-base text-slate-600">
              {/* Dummy: workflow section intro copy */}
              Keep momentum with a workflow that closes the loop from concept to
              performance. Each step is orchestrated and auditable.
            </p>
          </div>
          <div className="relative grid gap-8 md:grid-cols-5">
            <div className="absolute inset-x-0 top-16 hidden border-t border-dashed border-slate-200 md:block" />
            {workflowSteps.map((step, index) => (
              <div
                key={step.key}
                className="relative flex flex-col items-center text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-surface text-sm font-semibold text-accent shadow-sm">
                  {index + 1}
                </div>
                <p className="mt-4 font-heading text-lg text-navy">
                  {step.key}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 text-center text-sm text-slate-500">
        © 2025 Adsett. Built at HackUTA.
      </footer>
    </div>
  );
}
