"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface AdCreative {
  id: string;
  campaignId: string;
  createdAt: string;
  src: string; // Dummy: client-only URL; replace with real storage URL later.
  fileName?: string;
  width?: number;
  height?: number;
  metrics?: {
    quality?: number;
    hostility?: number;
    engagement?: number;
    resonance?: number;
  };
}

export interface CampaignEntry {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  objective?: string;
  targetAudience?: string;
  platforms?: string[];
  contextAnswers?: {
    emotion?: string;
    success?: string;
    inspiration?: string;
  };
  insights?: {
    quality?: number;
    hostility?: number;
    engagement?: number;
    resonance?: number;
  };
  ads?: AdCreative[];
}

interface CampaignContextValue {
  campaigns: CampaignEntry[];
  addCampaign: (campaign: CampaignEntry) => void;
  addAd: (campaignId: string, ad: AdCreative) => void;
  getCampaignAds: (campaignId: string) => AdCreative[];
  getCampaignById: (campaignId: string) => CampaignEntry | undefined;
  clearCampaigns: () => void;
}

const CampaignContext = createContext<CampaignContextValue | undefined>(undefined);

const STORAGE_KEY = "adsett_campaigns_v1";

function dedupeCampaigns(list: CampaignEntry[]): CampaignEntry[] {
  const seen = new Set<string>();
  const unique: CampaignEntry[] = [];
  for (const campaign of list) {
    const key = campaign.id;
    if (seen.has(key)) continue;
    seen.add(key);

    const dedupedAds = dedupeAds(campaign.ads ?? []);
    unique.push({ ...campaign, ads: dedupedAds });
  }
  return unique;
}

function dedupeAds(list: AdCreative[]): AdCreative[] {
  const seen = new Set<string>();
  const unique: AdCreative[] = [];
  for (const ad of list) {
    const key = ad.id;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(ad);
  }
  return unique;
}

function computeCampaignAverages(campaign: CampaignEntry): CampaignEntry {
  const ads = campaign.ads ?? [];
  if (ads.length === 0) {
    return { ...campaign, insights: undefined };
  }
  const totals = { quality: 0, hostility: 0, engagement: 0, resonance: 0 };
  const counts = { quality: 0, hostility: 0, engagement: 0, resonance: 0 };

  ads.forEach((ad) => {
    if (!ad.metrics) return;
    if (typeof ad.metrics.quality === "number") {
      totals.quality += ad.metrics.quality;
      counts.quality += 1;
    }
    if (typeof ad.metrics.hostility === "number") {
      totals.hostility += ad.metrics.hostility;
      counts.hostility += 1;
    }
    if (typeof ad.metrics.engagement === "number") {
      totals.engagement += ad.metrics.engagement;
      counts.engagement += 1;
    }
    if (typeof ad.metrics.resonance === "number") {
      totals.resonance += ad.metrics.resonance;
      counts.resonance += 1;
    }
  });

  const insights = {
    quality: counts.quality ? Math.round((totals.quality / counts.quality) * 10) / 10 : undefined,
    hostility: counts.hostility ? Math.round((totals.hostility / counts.hostility) * 10) / 10 : undefined,
    engagement: counts.engagement ? Math.round(totals.engagement / counts.engagement) : undefined,
    resonance: counts.resonance ? Math.round((totals.resonance / counts.resonance) * 10) / 10 : undefined,
  };

  return { ...campaign, insights };
}

export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const [campaigns, setCampaigns] = useState<CampaignEntry[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = dedupeCampaigns(JSON.parse(stored) as CampaignEntry[]);
        setCampaigns(parsed.map(computeCampaignAverages));
      }
    } catch (error) {
      console.error("Failed to read campaigns from storage", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dedupeCampaigns(campaigns)));
    } catch (error) {
      console.error("Failed to persist campaigns", error);
    }
  }, [campaigns]);

  const addCampaign = useCallback((campaign: CampaignEntry) => {
    setCampaigns((prev) => {
      const exists = prev.some(
        (entry) => entry.id === campaign.id || entry.name.trim().toLowerCase() === campaign.name.trim().toLowerCase()
      );
      if (exists) return prev;
      const withDefaults = computeCampaignAverages({ ...campaign, ads: campaign.ads ?? [] });
      return dedupeCampaigns([withDefaults, ...prev]);
    });
  }, []);

  const addAd = useCallback((campaignId: string, ad: AdCreative) => {
    setCampaigns((prev) => {
      return prev.map((campaign) => {
        if (campaign.id !== campaignId) return campaign;

        const ads = dedupeAds([ad, ...(campaign.ads ?? [])]);

        return computeCampaignAverages({ ...campaign, ads });
      });
    });
  }, []);

  const clearCampaigns = useCallback(() => {
    setCampaigns([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const getCampaignAds = useCallback(
    (campaignId: string) => campaigns.find((campaign) => campaign.id === campaignId)?.ads ?? [],
    [campaigns]
  );

  const getCampaignById = useCallback((campaignId: string) => campaigns.find((campaign) => campaign.id === campaignId), [campaigns]);

  const value = useMemo(
    () => ({ campaigns, addCampaign, addAd, getCampaignAds, getCampaignById, clearCampaigns }),
    [campaigns, addCampaign, addAd, getCampaignAds, getCampaignById, clearCampaigns]
  );

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

export function useCampaigns() {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error("useCampaigns must be used within a CampaignProvider");
  }
  return context;
}

// Dummy: local client-side persistence until CockroachDB integration.
// TODO [backend]: persist campaigns/ads to CockroachDB and object storage.
