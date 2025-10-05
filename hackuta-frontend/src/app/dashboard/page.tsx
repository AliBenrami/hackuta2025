"use client";

import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { CampaignPanel } from "@/components/CampaignPanel";
import { Header } from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { useCampaigns } from "@/context/CampaignContext";
import { getCampaigns, getImages } from "@/lib/api";
import { CampaignResponse } from "@/lib/api";
import { logout } from "@/lib/api";

function CreateCampaignCTA({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full max-w-6xl mx-auto mt-8 flex h-36 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-accent/30 bg-white text-center shadow-sm transition hover:border-accent hover:bg-accent/5 hover:shadow-md"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent shadow-sm">
        <PlusCircle className="h-6 w-6" />
      </span>
      <span className="mt-1 text-sm font-medium text-accent">
        Create a New Campaign
      </span>
    </button>
  );
}

export default function DashboardPage() {
  const { campaigns, addCampaign, clearCampaigns, setCampaignList } =
    useCampaigns();
  const { user } = useAuth();
  const router = useRouter();
  const hasCampaigns = campaigns.length > 0;

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const apiCampaigns = await getCampaigns();
        const mapped = apiCampaigns.map((c) => ({
          id: String(c.id),
          name: c.name,
          description: c.description,
          contextAnswers: {
            emotion: c.emotion ?? undefined,
            success: c.success ?? undefined,
            inspiration: c.inspiration ?? undefined,
          },
          createdAt: c.created_at,
          ads: (c.images || []).map((img) => ({
            id: String(img.id),
            campaignId: String(c.id),
            createdAt: img.created_at,
            src: img.url,
            fileName: img.filename,
            initialInsight: img.analysis_text,
          })),
        }));
        setCampaignList(mapped);
      } catch (e) {
        // noop: keep empty state on failure
      }
    };
    // Always load campaigns when user is authenticated, regardless of cached data
    if (user) {
      loadCampaigns();
    }
  }, [user, setCampaignList]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <DashboardHeader />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pt-12 sm:px-8 lg:px-12">
        <main className="flex flex-1 flex-col">
          <section className="flex flex-col gap-4">
            <h1 className="text-3xl font-heading font-semibold text-navy sm:text-4xl">
              {user?.name ? `Welcome back, ${user.name}` : "Welcome back"}
            </h1>
            <p className="text-sm text-slate-600">
              Track creative performance, upload new assets, and keep your team
              aligned in one workspace.
            </p>
          </section>

          {hasCampaigns ? (
            <section
              aria-labelledby="campaigns-heading"
              className="mt-10 space-y-8"
            >
              <div className="space-y-2">
                <h2
                  id="campaigns-heading"
                  className="text-2xl font-heading font-semibold text-navy"
                >
                  Your Campaigns
                </h2>
                <p className="text-sm text-slate-600">
                  View campaign insights, upload creatives, and keep your launch
                  plan on track.
                </p>
              </div>
              <div className="flex flex-col space-y-4">
                {campaigns.map((campaign) => (
                  <CampaignPanel key={campaign.id} campaign={campaign} />
                ))}
                <CreateCampaignCTA
                  onClick={() => router.push("/dashboard/new-campaign")}
                />
              </div>
            </section>
          ) : (
            <section className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="space-y-6">
                <span className="text-3xl font-heading font-semibold text-navy sm:text-4xl">
                  Looks pretty dry in here.
                </span>
                <p className="text-base text-slate-500">
                  Craft your first campaign to spark the Adsett creative loop.
                </p>
                <CreateCampaignCTA
                  onClick={() => router.push("/dashboard/new-campaign")}
                />
              </div>
            </section>
          )}
        </main>
      </div>

      <footer className="mt-auto border-t border-slate-200/60 bg-white/70 py-6 text-center text-xs text-slate-500">
        © 2025 Adsett — Built at HackUTA.
      </footer>
    </div>
  );
}

const DashboardHeader = () => {
  const { user } = useAuth();

  return (
    <header className="bg-gradient-to-r from-slate-50 via-white to-blue-50 border-b border-slate-200">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-8 lg:px-12">
        <span className="text-2xl font-heading font-semibold text-navy">
          Adsett
          <span className="text-accent">.</span>
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">
            Welcome, {user?.name ?? "User"}
          </span>
          <button
            onClick={() => logout()}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};
