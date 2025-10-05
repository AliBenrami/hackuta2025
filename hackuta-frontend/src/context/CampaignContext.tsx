"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface AdCreative {
  id: string;
  campaignId: string;
  createdAt: string;
  src: string; // Dummy: client-only URL; replace with real storage URL later.
  fileName?: string;
  initialInsight?: string;
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
  deleteAd: (campaignId: string, adId: string) => void;
  updateAdMetrics: (
    campaignId: string,
    adId: string,
    metrics: NonNullable<AdCreative["metrics"]>
  ) => void;
  getCampaignAds: (campaignId: string) => AdCreative[];
  getCampaignById: (campaignId: string) => CampaignEntry | undefined;
  deleteCampaign: (campaignId: string) => void;
  clearCampaigns: () => void;
  setCampaignList: (list: CampaignEntry[]) => void;
  renameAd: (campaignId: string, adId: string, newName: string) => void;
}

const CampaignContext = createContext<CampaignContextValue | undefined>(
  undefined
);

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
    quality: counts.quality
      ? Math.round((totals.quality / counts.quality) * 10) / 10
      : undefined,
    hostility: counts.hostility
      ? Math.round((totals.hostility / counts.hostility) * 10) / 10
      : undefined,
    engagement: counts.engagement
      ? Math.round(totals.engagement / counts.engagement)
      : undefined,
    resonance: counts.resonance
      ? Math.round((totals.resonance / counts.resonance) * 10) / 10
      : undefined,
  };

  return { ...campaign, insights };
}

export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const [campaigns, setCampaigns] = useState<CampaignEntry[]>([]);

  // Persistence disabled: campaigns only live in memory for this session.
  // Deliberately do not read or write localStorage to avoid saving in browser storage.

  const addCampaign = useCallback((campaign: CampaignEntry) => {
    setCampaigns((prev) => {
      const exists = prev.some(
        (entry) =>
          entry.id === campaign.id ||
          entry.name.trim().toLowerCase() === campaign.name.trim().toLowerCase()
      );
      if (exists) return prev;
      const withDefaults = computeCampaignAverages({
        ...campaign,
        ads: campaign.ads ?? [],
      });
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

  const deleteAd = useCallback((campaignId: string, adId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== campaignId) return c;
        const ads = (c.ads ?? []).filter((a) => a.id !== adId);
        return computeCampaignAverages({ ...c, ads });
      })
    );
  }, []);

  const updateAdMetrics = useCallback(
    (
      campaignId: string,
      adId: string,
      metrics: NonNullable<AdCreative["metrics"]>
    ) => {
      setCampaigns((prev) => {
        return prev.map((campaign) => {
          if (campaign.id !== campaignId) return campaign;
          const ads = (campaign.ads ?? []).map((ad) =>
            ad.id === adId
              ? { ...ad, metrics: { ...ad.metrics, ...metrics } }
              : ad
          );
          return computeCampaignAverages({ ...campaign, ads });
        });
      });
    },
    []
  );

  const renameAd = useCallback(
    (campaignId: string, adId: string, newName: string) => {
      setCampaigns((prev) =>
        prev.map((campaign) => {
          if (campaign.id !== campaignId) return campaign;
          const ads = (campaign.ads ?? []).map((ad) =>
            ad.id === adId ? { ...ad, fileName: newName } : ad
          );
          return computeCampaignAverages({ ...campaign, ads });
        })
      );
    },
    []
  );

  const deleteCampaign = useCallback((campaignId: string) => {
    setCampaigns((prev) =>
      prev.filter((campaign) => campaign.id !== campaignId)
    );
  }, []);

  const clearCampaigns = useCallback(() => {
    setCampaigns([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const setCampaignList = useCallback((list: CampaignEntry[]) => {
    const normalized = list.map((c) =>
      computeCampaignAverages({ ...c, ads: c.ads ?? [] })
    );
    setCampaigns(dedupeCampaigns(normalized));
  }, []);

  const getCampaignAds = useCallback(
    (campaignId: string) =>
      campaigns.find((campaign) => campaign.id === campaignId)?.ads ?? [],
    [campaigns]
  );

  const getCampaignById = useCallback(
    (campaignId: string) =>
      campaigns.find((campaign) => campaign.id === campaignId),
    [campaigns]
  );

  const value = useMemo(
    () => ({
      campaigns,
      addCampaign,
      addAd,
      deleteAd,
      updateAdMetrics,
      getCampaignAds,
      getCampaignById,
      deleteCampaign,
      clearCampaigns,
      setCampaignList,
      renameAd,
    }),
    [
      campaigns,
      addCampaign,
      addAd,
      deleteAd,
      updateAdMetrics,
      getCampaignAds,
      getCampaignById,
      deleteCampaign,
      clearCampaigns,
      setCampaignList,
      renameAd,
    ]
  );

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
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
