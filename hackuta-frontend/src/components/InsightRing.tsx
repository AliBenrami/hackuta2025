"use client";

import React from "react";

interface InsightRingProps {
  label: string;
  value?: number;
  max?: number;
  disabled?: boolean;
  colorClass?: string;
  size?: "lg" | "md" | "sm";
}

const SIZE_MAP = {
  lg: { outer: 96, inner: 64, border: 8 },
  md: { outer: 80, inner: 48, border: 6 },
  sm: { outer: 64, inner: 40, border: 5 },
} as const;

export function InsightRing({
  label,
  value,
  max = 100,
  disabled = false,
  colorClass = "text-blue-600",
  size = "lg",
}: InsightRingProps) {
  const percent = value !== undefined && max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const displayValue = value !== undefined ? (max <= 10 ? `${value}` : `${Math.round(value)}%`) : "—";

  const dimensions = SIZE_MAP[size];

  return (
    <div className={`flex flex-col items-center ${disabled ? "opacity-60" : ""}`}>
      <div
        className={`relative flex items-center justify-center rounded-full shadow-[0_0_12px_rgba(37,99,235,0.08)] transition-transform ${
          disabled ? "" : "hover:scale-105"
        } ${disabled ? "text-slate-200" : colorClass}`}
        style={{ width: dimensions.outer, height: dimensions.outer }}
        aria-label={`${label}: ${displayValue}`}
      >
        <div
          className="absolute inset-0 rounded-full border-slate-200"
          style={{ borderWidth: dimensions.border }}
          aria-hidden
        />
        {!disabled && value !== undefined ? (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              borderColor: "currentColor",
              borderStyle: "solid",
              borderWidth: dimensions.border,
              clipPath: `inset(${(1 - percent) * 100}% 0 0 0)`,
            }}
            aria-hidden
          />
        ) : null}
        <div
          className="relative z-10 flex items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-700"
          style={{ width: dimensions.inner, height: dimensions.inner }}
        >
          {displayValue}
        </div>
      </div>
      <span className="mt-2 text-sm text-slate-600 text-center">{label}</span>
      {/* Dummy: static visualization; TODO [backend]: feed with real metrics. */}
    </div>
  );
}
