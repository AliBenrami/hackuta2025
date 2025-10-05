import Image from "next/image";

import type { AdCreative } from "@/context/CampaignContext";
import { InsightRing } from "@/components/InsightRing";

interface AdRowProps {
  ad: AdCreative;
}

export function AdRow({ ad }: AdRowProps) {
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(ad.createdAt));

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-6">
          <div className="relative h-28 w-40 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {ad.src ? (
              <Image src={ad.src} alt={ad.fileName ?? "Ad creative"} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                Awaiting preview
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-700">{ad.fileName ?? "Untitled creative"}</p>
            <p className="text-xs text-slate-400">Uploaded {formattedDate}</p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>
                {ad.width ?? "—"}×{ad.height ?? "—"} px
              </span>
              <span aria-hidden>•</span>
              <button
                type="button"
                className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-500 transition hover:border-slate-400 hover:text-slate-600"
                disabled
              >
                Update metrics
              </button>
              {/* Dummy: placeholder metrics control. */}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InsightRing
          label="Quality"
          value={ad.metrics?.quality}
          max={10}
          disabled={ad.metrics?.quality === undefined}
          colorClass="text-blue-600"
          size="md"
        />
        <InsightRing
          label="Hostility"
          value={ad.metrics?.hostility}
          max={10}
          disabled={ad.metrics?.hostility === undefined}
          colorClass="text-orange-500"
          size="md"
        />
        <InsightRing
          label="Engagement"
          value={ad.metrics?.engagement}
          max={100}
          disabled={ad.metrics?.engagement === undefined}
          colorClass="text-green-600"
          size="md"
        />
        <InsightRing
          label="Resonance"
          value={ad.metrics?.resonance}
          max={10}
          disabled={ad.metrics?.resonance === undefined}
          colorClass="text-purple-500"
          size="md"
        />
      </div>
      <p className="text-xs text-slate-400">Pending analysis</p>
      {/* Dummy: placeholder metrics; TODO [backend]: populate after /api/analyze completes. */}
    </div>
  );
}
