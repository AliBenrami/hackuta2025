import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AdSett | Sign in",
  description: "Access your AdSett account to manage campaigns and insights.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-6 py-12 sm:px-8 lg:px-12">
        {children}
      </div>
    </div>
  );
}

