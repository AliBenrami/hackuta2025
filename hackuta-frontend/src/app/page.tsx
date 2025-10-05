"use client";

import { SessionProvider } from "next-auth/react";
import ImageManager from "@/components/ImageManager";

export default function Home() {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <ImageManager />
      </div>
    </SessionProvider>
  );
}
