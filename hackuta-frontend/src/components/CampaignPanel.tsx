import Link from "next/link";
import { useMemo } from "react";

import type { CampaignEntry } from "@/context/CampaignContext";
import { InsightRing } from "@/components/InsightRing";

export function CampaignPanel({ campaign }: { campaign: CampaignEntry }) {
  const ads = campaign.ads ?? [];
  const insights = useMemo(() => campaign.insights, [campaign]);
  const createdDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(campaign.createdAt)),
    [campaign.createdAt]
  );

  const hasAds = ads.length > 0;

  return (
    <article className="mx-auto w-full max-w-6xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 hover:shadow-md">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-2xl font-semibold text-slate-800">
          {campaign.name}
        </h2>
        <p className="text-sm italic text-slate-500">
          Started: {createdDate} — Present
        </p>
      </div>

      <div className="my-6 border-t border-slate-200" />

      <div className="flex flex-wrap items-center justify-center gap-8">
        <InsightRing
          label="Ad Quality"
          value={insights?.quality}
          max={10}
          disabled={!hasAds || insights?.quality === undefined}
          colorClass="text-blue-600"
          size="lg"
        />
        <InsightRing
          label="Hostility"
          value={insights?.hostility}
          max={10}
          disabled={!hasAds || insights?.hostility === undefined}
          colorClass="text-orange-500"
          size="lg"
        />
        <InsightRing
          label="Engagement"
          value={insights?.engagement}
          max={100}
          disabled={!hasAds || insights?.engagement === undefined}
          colorClass="text-green-600"
          size="lg"
        />
        <InsightRing
          label="Resonance"
          value={insights?.resonance}
          max={10}
          disabled={!hasAds || insights?.resonance === undefined}
          colorClass="text-purple-500"
          size="lg"
        />
      </div>

      <div className="mt-2 text-center text-xs text-slate-400">
        {hasAds ? `Averages across ${ads.length} ad(s)` : "Awaiting creatives"}
        {/* Dummy: derived averages; TODO [backend]: compute server-side for consistency. */}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
        <span>Last synced: 2h ago</span>
        <Link
          href={`/dashboard/campaign/${campaign.id}`}
          className="text-blue-600 transition hover:underline"
        >
          View Details →
        </Link>
      </div>
    </article>
  );
}
