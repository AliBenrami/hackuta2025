"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useCampaigns } from "@/context/CampaignContext";
import {
  uploadAndAnalyzeImage,
  deleteCampaign,
  updateCampaign,
  deleteImage,
  updateImage,
  deployImageToX,
  getTweetMetrics,
  getTweetComments,
} from "@/lib/api";

interface CampaignDetailPageProps {
  params: {
    id: string;
  };
}

type AssetStatus = "not_deployed" | "processing" | "ready";

interface LocalAssetState {
  status: AssetStatus;
  nameOverride?: string;
  previewOverrideSrc?: string;
  initialSummary?: string; // After upload, before deploy
  replacing?: boolean; // Inline replace mode
  metrics?: {
    resonance?: number; // 0-10
    engagement?: number; // 0-100
    hostility?: number; // 0-10
    controversy?: number; // 0-10
    totalQualityPct?: number; // 0-100
  };
  finalSummary?: string; // After deploy completes
  // X (Twitter) integration fields
  tweetId?: string; // ID of posted tweet
  tweetUrl?: string; // Full URL to tweet
  xMetrics?: {
    likes: number;
    replies: number;
    retweets: number;
    quotes: number;
    views: number;
  };
}

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function formatDate(dateIso: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateIso));
  } catch {
    return dateIso;
  }
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getMockInitialCriticism(): string {
  const variants = [
    "Consider increasing contrast for the headline to improve readability.",
    "Visual balance is solid; try simplifying background elements.",
    "Message is clear but could benefit from a stronger call-to-action.",
    "Great color usage; consider highlighting the value prop earlier.",
  ];
  return variants[Math.floor(Math.random() * variants.length)];
}

function getMockCommentsSummary(
  resonance: number,
  engagement: number,
  hostility: number,
  controversy: number
): string {
  const tone =
    hostility > 6 || controversy > 6
      ? "mixed"
      : engagement > 60
      ? "positive"
      : "neutral";
  if (tone === "positive") {
    return "High resonance and engagement reported. Audience finds the creative compelling with clear messaging.";
  }
  if (tone === "mixed") {
    return "Strong response with some pushback detected. Consider softening language and clarifying the offer.";
  }
  return "Moderate interest and clarity. Iterations on visual hierarchy may boost performance.";
}

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const {
    getCampaignById,
    getCampaignAds,
    updateAdMetrics,
    addAd,
    deleteAd,
    deleteCampaign: deleteCampaignFromContext,
    clearCampaigns,
    renameAd,
  } = useCampaigns();
  const campaignId =
    (Array.isArray(params.id) ? params.id[0] : params.id) || "";

  // All hooks must be called unconditionally at the top level.
  const campaign = getCampaignById(campaignId);
  const [displayName, setDisplayName] = useState<string | undefined>(
    campaign?.name
  );
  const [displayDescription, setDisplayDescription] = useState<
    string | undefined
  >(campaign?.description);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(true);
  const [descriptionOpen, setDescriptionOpen] = useState<boolean>(false);
  const [metadataOpen, setMetadataOpen] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showArchiveModal, setShowArchiveModal] = useState<boolean>(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>("");
  const [archiveConfirmText, setArchiveConfirmText] = useState<string>("");
  const [assetState, setAssetState] = useState<Record<string, LocalAssetState>>(
    {}
  );
  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  // Auto-save campaign name and description with debounce
  useEffect(() => {
    if (!campaign || !displayName || displayName === campaign.name) return;

    const timer = setTimeout(async () => {
      try {
        await updateCampaign(campaignId, { name: displayName });
      } catch (error) {
        console.error("Failed to update campaign name:", error);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [displayName, campaign, campaignId]);

  useEffect(() => {
    if (
      !campaign ||
      !displayDescription ||
      displayDescription === campaign.description
    )
      return;

    const timer = setTimeout(async () => {
      try {
        await updateCampaign(campaignId, { description: displayDescription });
      } catch (error) {
        console.error("Failed to update campaign description:", error);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [displayDescription, campaign, campaignId]);

  // Now that all hooks are declared, we can safely return if the campaign is not found.
  if (!campaign) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-slate-200 bg-white px-6 py-6">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
            <span className="text-2xl font-heading font-semibold text-navy">
              Adsett
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

  // Upload zone handlers
  const onBrowse = () => {
    console.log("onBrowse called");
    // Try both refs since we have two file inputs
    const input = fileInputRef1.current || fileInputRef2.current;
    console.log("Input element:", input);
    if (input) {
      console.log("Calling click() on input...");
      try {
        input.click();
        console.log("click() called successfully");
      } catch (err) {
        console.error("Error calling click():", err);
      }
    } else {
      console.error("No file input ref found!");
    }
  };

  const validateFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Only PNG and JPG are supported.";
    }
    if (file.size > MAX_SIZE) {
      return "File exceeds 10MB limit.";
    }
    return null;
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || !campaign) return;
      setErrorText(null);
      setIsUploading(true);
      const list = Array.from(files);

      for (const file of list) {
        const validation = validateFile(file);
        if (validation) {
          setErrorText(validation);
          continue;
        }

        try {
          const response = await uploadAndAnalyzeImage(
            file,
            parseInt(campaignId, 10)
          );
          const { image, analytics } = response;

          // Create asset in context (keeps UI consistent across app)
          addAd(campaignId, {
            id: image.id.toString(),
            campaignId: campaignId,
            createdAt: image.created_at,
            src: image.url,
            fileName: image.filename,
            initialInsight: image.analysis_text, // <-- FIX: Persist insight to context
          });

          // Initialize local state with real data
          setAssetState((prev) => ({
            ...prev,
            [image.id]: {
              status: "not_deployed",
              initialSummary: image.analysis_text,
            },
          }));
        } catch (err) {
          setErrorText(
            err instanceof Error ? err.message : "An unknown error occurred"
          );
        }
      }

      setIsUploading(false);
      if (fileInputRef1.current) fileInputRef1.current.value = "";
      if (fileInputRef2.current) fileInputRef2.current.value = "";
    },
    [addAd, campaignId]
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  // Deploy simulation
  const handleDeploy = useCallback(
    async (adId: string) => {
      if (!campaign?.ads) return;

      // Find the ad to get the image database ID
      const ad = campaign.ads.find((a) => a.id === adId);
      if (!ad) return;

      setAssetState((prev) => ({
        ...prev,
        [adId]: {
          ...(prev[adId] ?? { status: "not_deployed" }),
          status: "processing",
        },
      }));

      try {
        // Deploy to Twitter - this will post the image and schedule comment fetching
        const imageDbId = parseInt(ad.id, 10);
        const deployResponse = await deployImageToX(imageDbId);

        // Wait a bit for mock metrics generation
        const delay = randomInt(3000, 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));

        const resonance = randomInt(4, 10); // 0-10
        const engagement = randomInt(30, 95); // 0-100
        const hostility = randomInt(0, 9); // 0-10
        const controversy = Math.max(
          0,
          Math.min(10, hostility + randomInt(-2, 3))
        );
        const totalQualityPct = Math.round(
          ((resonance + hostility + controversy + engagement / 10) / 4) * 10
        );

        // Update local metrics with tweet info
        setAssetState((prev) => ({
          ...prev,
          [adId]: {
            ...(prev[adId] ?? { status: "not_deployed" }),
            status: "ready",
            tweetId: deployResponse.tweet_id,
            tweetUrl: deployResponse.tweet_url,
            metrics: {
              resonance,
              engagement,
              hostility,
              controversy,
              totalQualityPct,
            },
            finalSummary: getMockCommentsSummary(
              resonance,
              engagement,
              hostility,
              controversy
            ),
          },
        }));

        // Feed context metrics to compute campaign aggregates
        const mappedQuality =
          Math.round(
            ((resonance + hostility + controversy + engagement / 10) / 4) * 10
          ) / 10;
        updateAdMetrics(campaignId, adId, {
          quality: mappedQuality,
          hostility,
          engagement,
          resonance,
        });
      } catch (error) {
        console.error("Failed to deploy ad to Twitter:", error);
        // Reset to not deployed on error
        setAssetState((prev) => ({
          ...prev,
          [adId]: {
            ...(prev[adId] ?? { status: "not_deployed" }),
            status: "not_deployed",
          },
        }));
      }
    },
    [campaign, updateAdMetrics, campaignId]
  );

  const handleReplace = useCallback((adId: string) => {
    setAssetState((prev) => ({
      ...prev,
      [adId]: {
        status: "not_deployed",
        replacing: true,
        previewOverrideSrc: undefined,
        initialSummary: undefined,
        metrics: undefined,
        finalSummary: undefined,
      },
    }));
  }, []);

  const handleReplaceFiles = useCallback(
    async (adId: string, files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      const err = !ACCEPTED_TYPES.includes(file.type)
        ? "Only PNG and JPG are supported."
        : file.size > MAX_SIZE
        ? "File exceeds 10MB limit."
        : null;
      if (err) {
        setErrorText(err);
        return;
      }
      const src = URL.createObjectURL(file);
      // Show local preview, clear previous summaries while uploading
      setAssetState((prev) => ({
        ...prev,
        [adId]: {
          ...(prev[adId] ?? { status: "not_deployed" }),
          replacing: false,
          previewOverrideSrc: src,
          status: "not_deployed",
          initialSummary: undefined,
          metrics: undefined,
          finalSummary: undefined,
          nameOverride: file.name,
        },
      }));

      try {
        // Upload and analyze as a new asset
        const response = await uploadAndAnalyzeImage(
          file,
          parseInt(campaignId, 10)
        );
        const { image } = response;

        // Remove the old asset (and its old insights) and add the new one
        try {
          await deleteImage(Number(adId));
        } catch (_) {
          // ignore delete errors to avoid blocking the flow
        }
        deleteAd(campaignId, adId);
        addAd(campaignId, {
          id: image.id.toString(),
          campaignId: campaignId,
          createdAt: image.created_at,
          src: image.url,
          fileName: image.filename,
          initialInsight: image.analysis_text,
        });

        setAssetState((prev) => ({
          ...prev,
          [image.id]: {
            status: "not_deployed",
            initialSummary: image.analysis_text,
          },
        }));
      } catch (e) {
        setErrorText(
          e instanceof Error ? e.message : "Failed to replace asset"
        );
      }
    },
    [campaignId, addAd, deleteAd]
  );

  const handleRename = useCallback(
    (adId: string, name: string) => {
      // Optimistically update local state for immediate UI feedback
      setAssetState((prev) => ({
        ...prev,
        [adId]: {
          ...(prev[adId] ?? { status: "not_deployed" }),
          nameOverride: name,
        },
      }));

      // Debounce the API call to avoid spamming the backend
      const timer = setTimeout(async () => {
        try {
          await updateImage(Number(adId), { filename: name });
        } catch (error) {
          console.error("Failed to update ad name:", error);
          // Optional: Add some UI to indicate save failure
        }
      }, 500); // 500ms delay

      // Cleanup function to cancel the timeout if the component unmounts
      // or if the user types again within the delay period.
      // NOTE: This part is tricky in React without a custom useDebounce hook.
      // For this implementation, we rely on the component lifecycle, but a
      // more robust solution would store and clear timers in a ref.
    },
    [updateImage]
  );

  const ads = getCampaignAds(campaignId);
  const hasAds = ads.length > 0;

  const createdDate = formatDate(campaign.createdAt);

  // Compute campaign-level aggregates based on uploaded assets' metrics
  const campaignAggregates = useMemo(() => {
    const metricList = ads
      .map((a) => assetState[a.id]?.metrics)
      .filter(Boolean) as NonNullable<LocalAssetState["metrics"]>[];
    if (metricList.length === 0) {
      return {
        resonance: undefined,
        engagement: undefined,
        hostility: undefined,
        controversy: undefined,
      } as const;
    }
    const sum = metricList.reduce<{
      resonance: number;
      engagement: number;
      hostility: number;
      controversy: number;
    }>(
      (acc, m) => ({
        resonance: acc.resonance + (m.resonance ?? 0),
        engagement: acc.engagement + (m.engagement ?? 0),
        hostility: acc.hostility + (m.hostility ?? 0),
        controversy: acc.controversy + (m.controversy ?? 0),
      }),
      { resonance: 0, engagement: 0, hostility: 0, controversy: 0 }
    );
    const n = metricList.length;
    return {
      resonance: Math.round((sum.resonance / n) * 10) / 10,
      engagement: Math.round(sum.engagement / n),
      hostility: Math.round((sum.hostility / n) * 10) / 10,
      controversy: Math.round((sum.controversy / n) * 10) / 10,
    } as const;
  }, [ads, assetState]);

  const campaignSummary = useMemo(() => {
    const r = campaignAggregates.resonance ?? 0;
    const e = campaignAggregates.engagement ?? 0;
    const h = campaignAggregates.hostility ?? 0;
    const c = campaignAggregates.controversy ?? 0;
    if (
      campaignAggregates.resonance === undefined &&
      campaignAggregates.engagement === undefined &&
      campaignAggregates.hostility === undefined &&
      campaignAggregates.controversy === undefined
    ) {
      return "Awaiting assets to compute campaign insights.";
    }
    return getMockCommentsSummary(r, e, h, c);
  }, [campaignAggregates]);

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
        {/* 1. Campaign Header */}
        <section className="mx-auto w-full max-w-4xl space-y-4 text-center">
          <h1 className="text-3xl font-heading font-semibold text-slate-800">
            {displayName ?? campaign.name}
          </h1>
          <p className="text-sm text-slate-500">Started on {createdDate}</p>
          {displayDescription ? (
            <p className="text-sm leading-6 text-slate-600">
              {displayDescription}
            </p>
          ) : null}
        </section>

        {/* 2. Campaign Insights Overview */}
        <section className="rounded-2xl border border-slate-200 bg-white/95 p-8 shadow-sm">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8">
            <div
              className={`flex flex-col items-center ${
                !hasAds ? "opacity-50" : ""
              }`}
            >
              <div className="h-16 w-16 rounded-full border-4 border-slate-200 bg-white"></div>
              <span className="mt-2 text-sm text-slate-600">Resonance</span>
            </div>
            <div
              className={`flex flex-col items-center ${
                !hasAds ? "opacity-50" : ""
              }`}
            >
              <div className="h-16 w-16 rounded-full border-4 border-slate-200 bg-white"></div>
              <span className="mt-2 text-sm text-slate-600">Engagement</span>
            </div>
            <div
              className={`flex flex-col items-center ${
                !hasAds ? "opacity-50" : ""
              }`}
            >
              <div className="h-16 w-16 rounded-full border-4 border-slate-200 bg-white"></div>
              <span className="mt-2 text-sm text-slate-600">Hostility</span>
            </div>
            <div
              className={`flex flex-col items-center ${
                !hasAds ? "opacity-50" : ""
              }`}
            >
              <div className="h-16 w-16 rounded-full border-4 border-slate-200 bg-white"></div>
              <span className="mt-2 text-sm text-slate-600">Controversy</span>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Campaign AI Insights
            </p>
            <p className="mt-2 text-sm text-slate-600">{campaignSummary}</p>
          </div>
        </section>

        {/* 3. Uploader: position depends on asset presence */}
        {!hasAds ? (
          <section className="mx-auto grid w-full max-w-4xl grid-cols-1 items-stretch gap-6 md:grid-cols-2">
            {/* Left: Upload */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                role="button"
                tabIndex={0}
                className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-8 text-center transition hover:border-accent/60 hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-accent/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onBrowse();
                  }
                }}
              >
                <h2 className="text-lg font-semibold text-slate-800">
                  Add Your First Asset
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Supports PNG and JPG up to 10MB.
                </p>
                <span className="mt-6 text-sm font-medium text-slate-700">
                  Drag & drop images here
                </span>
                <div className="mt-4">
                  <label
                    htmlFor="file-upload"
                    className={`inline-block cursor-pointer rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                      isUploading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isUploading ? "Uploading..." : "Browse files"}
                    <input
                      id="file-upload"
                      ref={fileInputRef1}
                      type="file"
                      accept={ACCEPTED_TYPES.join(",")}
                      multiple
                      onChange={onFileChange}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>
                {errorText ? (
                  <p className="mt-3 text-sm text-red-500">{errorText}</p>
                ) : null}
              </div>
            </div>

            {/* When no assets, show settings alongside uploader */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">
                  Campaign Settings
                </h2>
                <button
                  type="button"
                  onClick={() => setSettingsOpen((v) => !v)}
                  className="text-xs font-medium text-accent hover:text-accent-hover"
                >
                  {settingsOpen ? "Collapse" : "Expand"}
                </button>
              </div>
              {settingsOpen ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">
                      Campaign Name
                    </label>
                    <input
                      value={displayName ?? ""}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setDescriptionOpen((v) => !v)}
                      className="flex w-full items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-700"
                    >
                      <span>Description</span>
                      <span className="text-accent">
                        {descriptionOpen ? "−" : "+"}
                      </span>
                    </button>
                    {descriptionOpen ? (
                      <textarea
                        value={displayDescription ?? ""}
                        onChange={(e) => setDisplayDescription(e.target.value)}
                        rows={4}
                        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    ) : null}
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setMetadataOpen((v) => !v)}
                      className="flex w-full items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-700"
                    >
                      <span>Questions / Metadata</span>
                      <span className="text-accent">
                        {metadataOpen ? "−" : "+"}
                      </span>
                    </button>
                    {metadataOpen ? (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <input
                          placeholder="Target audience"
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 focus:border-accent focus:outline-none"
                        />
                        <input
                          placeholder="Primary platform"
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 focus:border-accent focus:outline-none"
                        />
                        <input
                          placeholder="Objective"
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 focus:border-accent focus:outline-none"
                        />
                        <input
                          placeholder="Budget hint"
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 focus:border-accent focus:outline-none"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowArchiveModal(true)}
                      className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-600 hover:border-slate-400"
                    >
                      Archive
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="flex-1 rounded-full bg-rose-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-rose-700"
                    >
                      Delete Campaign
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* 4. Uploaded Assets */}
        {hasAds ? (
          <section className="mx-auto w-full max-w-4xl space-y-6">
            {ads.map((ad) => {
              const local = assetState[ad.id];
              const status: AssetStatus = local?.status ?? "not_deployed";
              const displayName =
                local?.nameOverride ?? ad.fileName ?? "Untitled creative";
              const src = local?.previewOverrideSrc ?? ad.src;

              const onStartDeploy = () => handleDeploy(ad.id);
              const onReplace = () => handleReplace(ad.id);

              const onRename = (e: ChangeEvent<HTMLInputElement>) =>
                setAssetState((prev) => ({
                  ...prev,
                  [ad.id]: {
                    ...(prev[ad.id] ?? { status: "not_deployed" }),
                    nameOverride: e.target.value,
                  },
                }));

              const onSaveName = async () => {
                const newName =
                  assetState[ad.id]?.nameOverride ?? ad.fileName ?? "";
                if (!newName || newName === ad.fileName) return;
                try {
                  await updateImage(Number(ad.id), { filename: newName });
                  renameAd(campaignId, ad.id, newName);
                } catch (err) {
                  alert("Failed to save name. Please try again.");
                }
              };

              const metrics = local?.metrics;

              return (
                <div
                  key={ad.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    {/* Left: preview + meta */}
                    <div className="flex items-start gap-6">
                      <div className="relative h-28 w-40 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                        {src ? (
                          <Image
                            src={src}
                            alt={displayName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                            Preview
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <input
                          value={displayName}
                          onChange={onRename}
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={onSaveName}
                            className="rounded-full border border-slate-300 px-3 py-1 text-xs transition hover:border-slate-400"
                          >
                            Save
                          </button>
                          <span className="text-xs text-slate-400">
                            {ad.fileName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Uploaded {formatDate(ad.createdAt)}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>
                            Status:{" "}
                            {status === "not_deployed"
                              ? "Not Deployed"
                              : status === "processing"
                              ? "Processing"
                              : "Deployed"}
                          </span>
                          <span aria-hidden>•</span>
                          <button
                            type="button"
                            onClick={onStartDeploy}
                            disabled={status !== "not_deployed"}
                            className="rounded-full border border-slate-300 px-3 py-1 text-xs transition hover:border-slate-400 disabled:opacity-50"
                          >
                            Deploy
                          </button>
                          <button
                            type="button"
                            onClick={onReplace}
                            className="rounded-full border border-slate-300 px-3 py-1 text-xs transition hover:border-slate-400"
                          >
                            Replace
                          </button>
                          <span aria-hidden>•</span>
                          <button
                            type="button"
                            onClick={async () => {
                              const text = prompt(
                                "Type delete to remove this advertisement"
                              );
                              if ((text || "").toLowerCase() !== "delete")
                                return;
                              try {
                                await deleteImage(Number(ad.id));
                                deleteAd(campaignId, ad.id);
                              } catch (e) {
                                alert(
                                  "Failed to delete advertisement. Please try again."
                                );
                              }
                            }}
                            className="rounded-full border border-rose-300 px-3 py-1 text-xs text-rose-600 transition hover:border-rose-400 hover:text-rose-700"
                          >
                            Delete
                          </button>
                        </div>
                        {local?.replacing ? (
                          <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white p-4">
                            <p className="text-xs text-slate-500">
                              Select a new image to replace this asset.
                            </p>
                            <input
                              type="file"
                              accept={ACCEPTED_TYPES.join(",")}
                              className="mt-2 text-xs"
                              onChange={(e) =>
                                handleReplaceFiles(ad.id, e.target.files)
                              }
                            />
                            {errorText ? (
                              <p className="mt-2 text-xs text-red-500">
                                {errorText}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Right: 4 small rings (grayed until deployed) */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div
                        className={`flex flex-col items-center ${
                          metrics ? "" : "opacity-50"
                        }`}
                      >
                        <div className="h-12 w-12 rounded-full border-4 border-slate-200 bg-white" />
                        <span className="mt-1 text-[11px] text-slate-600">
                          Resonance
                        </span>
                      </div>
                      <div
                        className={`flex flex-col items-center ${
                          metrics ? "" : "opacity-50"
                        }`}
                      >
                        <div className="h-12 w-12 rounded-full border-4 border-slate-200 bg-white" />
                        <span className="mt-1 text-[11px] text-slate-600">
                          Engagement
                        </span>
                      </div>
                      <div
                        className={`flex flex-col items-center ${
                          metrics ? "" : "opacity-50"
                        }`}
                      >
                        <div className="h-12 w-12 rounded-full border-4 border-slate-200 bg-white" />
                        <span className="mt-1 text-[11px] text-slate-600">
                          Hostility
                        </span>
                      </div>
                      <div
                        className={`flex flex-col items-center ${
                          metrics ? "" : "opacity-50"
                        }`}
                      >
                        <div className="h-12 w-12 rounded-full border-4 border-slate-200 bg-white" />
                        <span className="mt-1 text-[11px] text-slate-600">
                          Controversy
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Insight Summary */}
                  <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      AI Insight Summary
                    </p>
                    {status === "not_deployed" && (
                      <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">
                        {ad.initialInsight ?? "Awaiting initial insights."}
                      </p>
                    )}
                    {status === "processing" && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-transparent" />
                        Processing… generating deployment insights
                      </div>
                    )}
                    {status === "ready" && (
                      <div className="mt-2 space-y-3 text-sm text-slate-700">
                        <p className="whitespace-pre-line">
                          {ad.initialInsight}
                        </p>

                        {/* Tweet Link */}
                        {assetState[ad.id]?.tweetUrl && (
                          <div className="pt-2 border-t border-slate-200">
                            <p className="text-xs font-semibold text-slate-500 mb-1">
                              Posted to X (Twitter):
                            </p>
                            <a
                              href={assetState[ad.id].tweetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 underline text-sm break-all"
                            >
                              {assetState[ad.id].tweetUrl}
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        ) : null}

        {/* When assets exist, place uploader below assets */}
        {hasAds ? (
          <section className="mx-auto w-full max-w-4xl space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div
                onDrop={onDrop}
                onDragOver={onDragOver}
                role="button"
                tabIndex={0}
                className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-8 text-center transition hover:border-accent/60 hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-accent/30"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onBrowse();
                  }
                }}
              >
                <h2 className="text-lg font-semibold text-slate-800">
                  Add More Assets
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Supports PNG and JPG up to 10MB.
                </p>
                <span className="mt-6 text-sm font-medium text-slate-700">
                  Drag & drop images here
                </span>
                <div className="mt-4">
                  <label
                    htmlFor="file-upload-more"
                    className={`inline-block cursor-pointer rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                      isUploading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {isUploading ? "Uploading..." : "Browse files"}
                    <input
                      id="file-upload-more"
                      ref={fileInputRef2}
                      type="file"
                      accept={ACCEPTED_TYPES.join(",")}
                      multiple
                      onChange={onFileChange}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>
                {errorText ? (
                  <p className="mt-3 text-sm text-red-500">{errorText}</p>
                ) : null}
              </div>
            </div>

            {/* Campaign Settings below uploader when assets exist */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">
                  Campaign Settings
                </h2>
                <button
                  type="button"
                  onClick={() => setSettingsOpen((v) => !v)}
                  className="text-xs font-medium text-accent hover:text-accent-hover"
                >
                  {settingsOpen ? "Collapse" : "Expand"}
                </button>
              </div>
              {settingsOpen ? (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500">
                      Campaign Name
                    </label>
                    <input
                      value={displayName ?? ""}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setDescriptionOpen((v) => !v)}
                      className="flex w-full items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-700"
                    >
                      <span>Description</span>
                      <span className="text-accent">
                        {descriptionOpen ? "−" : "+"}
                      </span>
                    </button>
                    {descriptionOpen ? (
                      <textarea
                        value={displayDescription ?? ""}
                        onChange={(e) => setDisplayDescription(e.target.value)}
                        rows={4}
                        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    ) : null}
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setMetadataOpen((v) => !v)}
                      className="flex w-full items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-700"
                    >
                      <span>Questions / Metadata</span>
                      <span className="text-accent">
                        {metadataOpen ? "−" : "+"}
                      </span>
                    </button>
                    {metadataOpen ? (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <input
                          placeholder="Target audience"
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 focus:border-accent focus:outline-none"
                        />
                        <input
                          placeholder="Primary platform"
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 focus:border-accent focus:outline-none"
                        />
                        <input
                          placeholder="Objective"
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 focus:border-accent focus:outline-none"
                        />
                        <input
                          placeholder="Budget hint"
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 focus:border-accent focus:outline-none"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowArchiveModal(true)}
                      className="flex-1 rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-600 hover:border-slate-400"
                    >
                      Archive
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="flex-1 rounded-full bg-rose-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-rose-700"
                    >
                      Delete Campaign
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
          © 2025 Adsett — Built at HackUTA.
        </footer>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800">
              Delete Campaign
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              This action cannot be undone. Type <strong>delete</strong> to
              confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type 'delete' to confirm"
              className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-600 hover:border-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (deleteConfirmText.toLowerCase() === "delete") {
                    try {
                      // Delete from backend
                      await deleteCampaign(campaignId);
                      // Clear the campaign cache so dashboard refetches from backend
                      clearCampaigns();
                      // Force a full page reload to the dashboard
                      window.location.href = "/dashboard";
                    } catch (error) {
                      console.error("Failed to delete campaign:", error);
                      alert("Failed to delete campaign. Please try again.");
                    }
                  }
                }}
                disabled={deleteConfirmText.toLowerCase() !== "delete"}
                className="rounded-full bg-rose-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Campaign
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Archive Confirmation Modal */}
      {showArchiveModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800">
              Archive Campaign
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Type <strong>archive</strong> to confirm archiving this campaign.
            </p>
            <input
              type="text"
              value={archiveConfirmText}
              onChange={(e) => setArchiveConfirmText(e.target.value)}
              placeholder="Type 'archive' to confirm"
              className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowArchiveModal(false);
                  setArchiveConfirmText("");
                }}
                className="rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-600 hover:border-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (archiveConfirmText.toLowerCase() === "archive") {
                    try {
                      await updateCampaign(campaignId, { archived: true });
                      setShowArchiveModal(false);
                      setArchiveConfirmText("");
                      // Optionally redirect to dashboard
                      router.push("/dashboard");
                    } catch (error) {
                      console.error("Failed to archive campaign:", error);
                      alert("Failed to archive campaign. Please try again.");
                    }
                  }
                }}
                disabled={archiveConfirmText.toLowerCase() !== "archive"}
                className="rounded-full bg-accent px-4 py-2 text-xs font-medium text-white transition hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Archive Campaign
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
