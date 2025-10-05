"use client";

import { ChangeEvent, DragEvent, useCallback, useRef, useState } from "react";

import { useCampaigns } from "@/context/CampaignContext";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface AdUploaderProps {
  campaignId: string;
}

export function AdUploader({ campaignId }: AdUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addAd } = useCampaigns();

  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleBrowse = () => fileInputRef.current?.click();

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  };

  const loadImageDetails = (file: File) =>
    new Promise<{ width?: number; height?: number }>((resolve) => {
      const image = new Image();
      image.onload = () => {
        resolve({ width: image.width, height: image.height });
      };
      image.onerror = () => resolve({});
      image.src = URL.createObjectURL(file);
    });

  const generateDemoMetrics = useCallback((seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const normalize = (value: number, min: number, max: number) => {
      const range = max - min;
      return ((value % range) + range) % range + min;
    };

    return {
      quality: Math.round(normalize(hash, 6, 9) * 10) / 10,
      hostility: Math.round(normalize(hash >> 3, 1, 4) * 10) / 10,
      engagement: Math.round(normalize(hash >> 6, 25, 65)),
      resonance: Math.round(normalize(hash >> 2, 2, 6) * 10) / 10,
    };
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setError(null);
      setIsUploading(true);

      const validFiles = Array.from(files).filter((file) => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          setError("Unsupported file type. Please upload PNG, JPEG, or WEBP images.");
          return false;
        }
        if (file.size > MAX_SIZE) {
          setError("Max 10MB per image. Please compress or choose a different file.");
          return false;
        }
        return true;
      });

      for (const file of validFiles) {
        const { width, height } = await loadImageDetails(file);
        const createdAt = new Date().toISOString();
        const src = URL.createObjectURL(file);

        addAd(
          campaignId,
          {
            id: crypto.randomUUID(),
            campaignId,
            createdAt,
            src,
            fileName: file.name,
            width,
            height,
            metrics: generateDemoMetrics(`${file.name}-${file.size}-${createdAt}`),
          }
        );
        // TODO [backend]: upload asset to object storage and persist metadata to CockroachDB.
      }

      setIsUploading(false);
      setDragActive(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [addAd, campaignId, generateDemoMetrics]
  );

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleBrowse();
          }
        }}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition focus:outline-none focus:ring-2 focus:ring-accent/40 ${
          dragActive ? "border-accent bg-blue-50/40" : "border-slate-300 bg-white"
        } ${isUploading ? "opacity-75" : ""}`}
      >
        <span className="text-sm font-semibold text-slate-700">Drop images here</span>
        <span className="text-xs text-slate-500 mt-1">or</span>
        <button
          type="button"
          onClick={handleBrowse}
          className="mt-3 rounded-full bg-accent px-5 py-2 text-sm font-medium text-white transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/40"
          disabled={isUploading}
        >
          {isUploading ? (
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Uploading…
            </span>
          ) : (
            "Browse files"
          )}
        </button>
        <p className="mt-3 text-xs text-slate-400">
          PNG, JPG, WEBP up to 10MB. Higher resolution creatives produce better insights.
        </p>
        {/* Dummy: uploads are not persisted to a server. */}
      </div>

      {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        multiple
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}

