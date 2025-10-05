"use client";

import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CampaignPanel } from "@/components/CampaignPanel";
import { Header } from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { useCampaigns } from "@/context/CampaignContext";

function CreateCampaignCTA({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full max-w-6xl mx-auto mt-8 flex h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center shadow-sm transition hover:border-blue-300 hover:bg-slate-50 hover:shadow-md"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 shadow-sm">
        <PlusCircle className="h-6 w-6" />
      </span>
      <span className="mt-1 text-sm font-medium text-blue-700">Create a New Campaign</span>
    </button>
  );
}

export default function DashboardPage() {
  const { campaigns } = useCampaigns();
  const { user } = useAuth();
  const router = useRouter();
  const hasCampaigns = campaigns.length > 0;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <Header variant="dashboard" userName={user?.name ?? user?.email ?? null} />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pt-28 sm:px-8 lg:px-12">
        <main className="flex flex-1 flex-col">
          <section className="flex flex-col gap-4"> 
            <h1 className="text-3xl font-heading font-semibold text-navy sm:text-4xl">
              {user?.name ? `Welcome back, ${user.name}` : "Welcome back"}
            </h1>
            <p className="text-sm text-slate-600">
              Track creative performance, upload new assets, and keep your team aligned in one workspace.
            </p>
          </section>

          {hasCampaigns ? (
            <section aria-labelledby="campaigns-heading" className="mt-10 space-y-8">
              <div className="space-y-2">
                <h2 id="campaigns-heading" className="text-2xl font-heading font-semibold text-navy">
                  Your Campaigns
                </h2>
                <p className="text-sm text-slate-600">
                  View campaign insights, upload creatives, and keep your launch plan on track.
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
            <section className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="space-y-6">
                <span className="text-3xl font-heading font-semibold text-navy sm:text-4xl">
                  Looks pretty dry in here.
                </span>
                <p className="text-base text-slate-500">
                  Craft your first campaign to spark the AdSett creative loop.
                </p>
                <CreateCampaignCTA onClick={() => router.push("/dashboard/new-campaign")} />
              </div>
            </section>
          )}
        </main>
      </div>

      <footer className="mt-auto border-t border-slate-200/60 bg-white/70 py-6 text-center text-xs text-slate-500">
        © 2025 AdSett — Built at HackUTA.
      </footer>
    </div>
  );
}

