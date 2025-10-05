"use client";

import { useEffect, useState } from "react";

export function ScrollHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hideAfterDelay = window.setTimeout(() => setVisible(false), 2500);

    const handleScroll = () => {
      const position = window.scrollY;
      if (position < 10) {
        setVisible(true);
      } else if (position > 100) {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.clearTimeout(hideAfterDelay);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      className={`pointer-events-none absolute bottom-12 left-1/2 flex -translate-x-1/2 flex-col items-center text-xs font-medium text-slate-500 transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}
      aria-hidden="true"
    >
      <span className="animate-bounce text-2xl opacity-70">↓</span>
      {/* Dummy: placeholder scroll prompt copy */}
      <span className="mt-1 uppercase tracking-[0.4em]">Scroll to explore</span>
    </div>
  );
}

// TODO [backend integration plan]
// 1. Replace local UI-only hint logic with tracked onboarding metrics once analytics added.
// 2. Connect visibility state to user preferences from CockroachDB profile table.
// 3. Respect reduced-motion preference for bounce animation when storing user settings.
// 4. Integrate with analytics to record first-visit scroll interactions.

