"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdRow } from "@/components/AdRow";
import { AdUploader } from "@/components/AdUploader";
import { InsightRing } from "@/components/InsightRing";
import { useCampaigns } from "@/context/CampaignContext";
import { uploadAndAnalyzeImage } from "@/lib/api";

interface CampaignDetailPageProps {
  params: {
    id: string;
  };
}

export default function CampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  const router = useRouter();
  const { getCampaignById, getCampaignAds, updateAdMetrics } = useCampaigns();
  const campaign = getCampaignById(params.id);

  const [latestAnalytics, setLatestAnalytics] = useState<any | null>(null);

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-slate-200 bg-white px-6 py-6">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
            <span className="text-2xl font-heading font-semibold text-navy">
              AdSett
              <span className="text-accent">.</span>
            </span>
            <button
              type="button"
              className="text-sm font-medium text-accent transition hover:text-accent-hover"
              onClick={() => router.push("/dashboard")}
            >
              ← Back to Dashboard
            </button>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 px-6 py-16 text-center">
          <h1 className="text-2xl font-heading font-semibold text-navy">
            Campaign not found
          </h1>
          <p className="text-sm text-slate-500">
            This campaign may have been removed or is unavailable.
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent-hover"
          >
            Return to Dashboard
          </button>
        </main>
      </div>
    );
  }

  const ads = getCampaignAds(campaign.id);
  const hasAds = ads.length > 0;

  const createdDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(campaign.createdAt));

  const insights = campaign.insights;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-gradient-to-r from-slate-50 via-white to-blue-50 border-b border-slate-200">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-8 lg:px-12">
          <span className="text-2xl font-heading font-semibold text-navy">
            Adsett
            <span className="text-accent">.</span>
          </span>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-accent transition hover:text-accent-hover"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12 sm:px-8 lg:px-12">
        <section className="space-y-2 text-center">
          <h1 className="text-3xl font-heading font-semibold text-slate-800">
            {campaign.name}
          </h1>
          <p className="text-sm italic text-slate-500">
            Started: {createdDate} — Present
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <InsightRing
              label="Ad Quality"
              value={insights?.quality}
              max={10}
              disabled={!hasAds || insights?.quality === undefined}
              colorClass="text-blue-600"
            />
            <InsightRing
              label="Hostility"
              value={insights?.hostility}
              max={10}
              disabled={!hasAds || insights?.hostility === undefined}
              colorClass="text-orange-500"
            />
            <InsightRing
              label="Engagement"
              value={insights?.engagement}
              max={100}
              disabled={!hasAds || insights?.engagement === undefined}
              colorClass="text-green-600"
            />
            <InsightRing
              label="Resonance"
              value={insights?.resonance}
              max={10}
              disabled={!hasAds || insights?.resonance === undefined}
              colorClass="text-purple-500"
            />
          </div>
          <p className="mt-3 text-center text-xs text-slate-400">
            {hasAds
              ? "Campaign averages (auto-updated)."
              : "Awaiting creatives to compute insights."}
            {/* Dummy: averages computed on client; TODO [backend]: compute via /api/feedback-summary server-side. */}
          </p>
        </section>

        <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            <AdUploader
              campaignId={campaign.id}
              onFileAdded={async ({ file, adId }) => {
                try {
                  const analyzed = await uploadAndAnalyzeImage(file);
                  setLatestAnalytics(analyzed);
                  // Update metrics for the newly created ad using returned analytics
                  updateAdMetrics(campaign.id, adId, {
                    quality: Math.round(analyzed.analytics.quality * 10) / 10,
                    hostility:
                      Math.round(analyzed.analytics.hostility * 10) / 10,
                    engagement: Math.round(analyzed.analytics.engagement),
                    resonance:
                      Math.round(analyzed.analytics.resonance * 10) / 10,
                  });
                } catch (err) {
                  console.error("Failed to upload/analyze image", err);
                  setLatestAnalytics({ error: "Failed to analyze image" });
                }
              }}
            />
            {latestAnalytics ? (
              <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-700">
                  Latest Analytics
                </h2>
                <pre className="mt-3 overflow-auto rounded bg-slate-50 p-3 text-xs text-slate-700">
                  {JSON.stringify(latestAnalytics, null, 2)}
                </pre>
              </section>
            ) : null}
            {hasAds ? null : (
              <p className="text-center text-sm text-slate-500">
                Upload your first creative to generate insights.
              </p>
            )}
            {hasAds ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <span>Filters:</span>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500"
                    disabled
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-400"
                    disabled
                  >
                    Needs Analysis
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-400"
                    disabled
                  >
                    High Potential
                  </button>
                  {/* Dummy: future filter chips. */}
                </div>
                <div className="flex flex-col gap-6">
                  {ads.map((ad) => (
                    <AdRow key={ad.id} ad={ad} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-6">
            {campaign.description ? (
              <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-700">
                  Campaign Description
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {campaign.description}
                </p>
                {/* Dummy: pure display; TODO [backend]: store and use as prompt conditioning input. */}
              </section>
            ) : null}
            {campaign.contextAnswers ? (
              <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-700">
                  Context Notes
                </h2>
                <div className="mt-4 space-y-3">
                  {campaign.contextAnswers.emotion ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Emotion Target
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {campaign.contextAnswers.emotion}
                      </p>
                    </div>
                  ) : null}
                  {campaign.contextAnswers.success ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Success Signal
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {campaign.contextAnswers.success}
                      </p>
                    </div>
                  ) : null}
                  {campaign.contextAnswers.inspiration ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Inspiration
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {campaign.contextAnswers.inspiration}
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        © 2025 Adsett — Built at HackUTA.
      </footer>
    </div>
  );
}
