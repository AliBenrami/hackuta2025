"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { CampaignPanel } from "@/components/CampaignPanel";
import { useCampaigns } from "@/context/CampaignContext";
import { User } from "lucide-react";

export const dynamic = "force-dynamic";

function CreateCampaignCTA({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full max-w-6xl mx-auto mt-8 flex h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center shadow-sm transition hover:border-blue-300 hover:bg-slate-50 hover:shadow-md"
    >
      {/* Dummy: frontend navigation only; TODO [backend]: restrict based on org/hobbyist roles. */}
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 shadow-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-9 w-9"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" x2="12" y1="8" y2="16" />
          <line x1="8" x2="16" y1="12" y2="12" />
        </svg>
      </span>
      <span className="mt-1 text-sm font-medium text-blue-700">Create a New Campaign</span>
    </button>
  );
}

export default function DashboardPage() {
  const { campaigns } = useCampaigns();
  const router = useRouter();
  const tumbleDelay = Math.random() * 10 + 5;

  const user = { type: "hobbyist", name: "Hasnain" } as const;
  // TODO [backend]: replace user mock with auth-based profile data

  const welcomeMessage = (() => {
    if (user.type === "hobbyist") {
      return `Welcome back, ${user.name}! Ready to launch your next campaign?`;
    }
    if (user.type === "organization") {
      return "Welcome back, Your Team — managing creativity at scale.";
    }
    return "Welcome to AdSett — your creative workspace.";
  })();

  const hasCampaigns = campaigns.length > 0;

  return (
    <div
      className={`relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground ${
        hasCampaigns ? "pb-4" : ""
      }`}
    >
      {/* Layout fix: adds footer spacing only when dashboard is populated with campaigns. */}
      <header className="flex h-16 items-center border-b border-slate-200/70 bg-white px-6 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 select-none" aria-label="AdSett Dashboard">
            <span className="text-2xl font-heading font-semibold tracking-wide text-navy">
              AdSett
              <span className="text-accent">.</span>
            </span>
          </Link>
          <button
            type="button"
            title="Account"
            aria-label="Account"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 transition hover:shadow-sm"
          >
            {/* TODO [frontend]: add user dropdown when auth is implemented */}
            {/* Dummy: temporary avatar placeholder until user data integration */}
            <User className="h-5 w-5 opacity-70" />
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pt-6 sm:px-8 lg:px-12">
        <main className="flex flex-1 flex-col">
          {hasCampaigns && (
            <div className="mx-auto mt-6 w-full max-w-6xl rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center text-sm text-slate-600">
              {welcomeMessage}
            </div>
          )}

          {hasCampaigns ? (
            <section aria-labelledby="campaigns-heading" className="mx-auto mt-8 w-full max-w-6xl space-y-8">
              <div className="mx-auto max-w-2xl space-y-2 text-center">
                <h1 id="campaigns-heading" className="text-3xl font-heading font-semibold text-navy sm:text-4xl">
                  Your Campaigns
                </h1>
                <p className="text-sm text-slate-600">
                  {/* Dummy: dashboard intro copy */}
                  Stay synced across creative, critique, and publishing workflows in one place.
                </p>
              </div>
              <div className="flex flex-col space-y-4">
                {campaigns.map((campaign) => (
                  <CampaignPanel key={campaign.id} campaign={campaign} />
                ))}
                <CreateCampaignCTA onClick={() => router.push("/dashboard/new-campaign")} />
              </div>
            </section>
          ) : (
            <section
              aria-labelledby="campaigns-heading"
              className="flex flex-1 flex-col items-center justify-center"
            >
              {/* Layout centers fully when no campaigns exist; disables reserved top padding. */}
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-1">
                  <h1 id="campaigns-heading" className="text-3xl font-heading font-semibold text-navy sm:text-4xl">
                    Your Campaigns
                  </h1>
                  <p className="text-sm text-slate-600">
                    {/* Dummy: dashboard intro copy */}
                    Stay synced across creative, critique, and publishing workflows in one place.
                  </p>
                </div>
                <span className="mt-6 text-2xl font-semibold text-slate-800">
                  {/* Dummy: empty-state placeholder copy */}
                  Looks pretty dry in here.
                </span>
                <p className="mt-2 text-base text-slate-500">
                  {/* Dummy: empty-state placeholder copy */}
                  Craft your first campaign to spark the AdSett creative loop.
                </p>
                <CreateCampaignCTA onClick={() => router.push("/dashboard/new-campaign")} />
              </div>
            </section>
          )}
        </main>
      </div>

      {hasCampaigns ? null : (
        <img
          src="/Tumbleweed.png"
          alt="tumbleweed rolling"
          className="pointer-events-none absolute bottom-20 left-0 z-10 h-16 w-16 opacity-70 animate-tumbleweed"
          style={{
            filter:
              "brightness(0) saturate(100%) invert(85%) sepia(2%) saturate(110%) hue-rotate(185deg) brightness(96%) contrast(90%)",
            // Dummy: placeholder tumbleweed animation; remove or replace once real campaigns render.
            // @ts-expect-error CSS custom property
            "--tumble-delay": `${tumbleDelay}s`,
          }}
        />
      )}

      <footer className="mt-auto border-t border-slate-200/60 bg-white/70 py-6 text-center text-xs text-slate-500">
        © 2025 AdSett — Built at HackUTA.
      </footer>

      {/* TODO [backend integration plan]
          1. Replace local mock data with CockroachDB queries via FastAPI microservice.
          2. Introduce organization_id and user_id for scoped campaigns.
          3. Add NextAuth.js for login and user session management.
          4. Implement /api/analyze and /api/fetch-metrics endpoints for campaign analysis.
        */}
    </div>
  );
}

