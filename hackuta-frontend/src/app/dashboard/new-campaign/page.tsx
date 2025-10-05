"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { useCampaigns } from "@/context/CampaignContext";
import { createCampaign } from "@/lib/api";

export const dynamic = "force-dynamic";

export default function NewCampaignPage() {
  const router = useRouter();
  const { addCampaign } = useCampaigns();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [context, setContext] = useState({
    emotion: "",
    success: "",
    inspiration: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameError = name.trim().length < 3 || name.trim().length > 50;
  const descriptionError = description.trim().length < 50;
  const descriptionCount = description.length;

  const isInvalid = nameError || descriptionError;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isInvalid) {
      return;
    }
    setError(null);
    setIsCreating(true);

    try {
      const created = await createCampaign({
        name: name.trim(),
        description: description.trim(),
        emotion: context.emotion || undefined,
        success: context.success || undefined,
        inspiration: context.inspiration || undefined,
      });
      addCampaign({
        id: String(created.id),
        name: created.name,
        description: created.description,
        contextAnswers: {
          emotion: created.emotion ?? undefined,
          success: created.success ?? undefined,
          inspiration: created.inspiration ?? undefined,
        },
        createdAt: created.created_at,
      });
      router.push("/dashboard");
    } catch (e) {
      setError("Failed to create campaign. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const descriptionHelper = useMemo(() => {
    if (descriptionCount === 0) {
      return "0 characters";
    }
    return `${descriptionCount} characters`;
  }, [descriptionCount]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-slate-200/60 bg-white/80">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8 lg:px-12">
          <span className="text-2xl font-heading font-semibold tracking-wide text-navy">
            Adsett
            <span className="text-accent">.</span>
          </span>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16 sm:px-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-heading font-semibold text-slate-800">
            Create a New Campaign
          </h1>
          <p className="text-sm text-slate-500">
            Define your campaign’s purpose and give our models the right context
            to critique it effectively.
          </p>
        </div>

        <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
          <section className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-navy">
              Campaign Name
            </label>
            <input
              id="name"
              type="text"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g., Summer Product Launch"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            {/* Dummy: validation placeholder will be replaced with backend validation */}
            {name.length > 0 && nameError && (
              <p className="text-xs text-red-500">
                Name must be between 3 and 50 characters.
              </p>
            )}
          </section>

          <div className="border-t border-slate-200" />

          <section className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-medium text-navy"
            >
              Campaign Description
            </label>
            <textarea
              id="description"
              rows={5}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe your campaign goals, audience, and key message. Minimum 50 characters."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{descriptionHelper}</span>
              {descriptionCount > 0 && descriptionError && (
                <span className="text-red-500">
                  Add at least 50 characters.
                </span>
              )}
            </div>
            {/* Dummy: local validation only; replace with backend logic later */}
          </section>

          <div className="border-t border-slate-200" />

          <section className="space-y-4">
            <p className="text-sm font-semibold text-navy">
              Context Questions (Optional)
            </p>
            <p className="text-xs text-slate-500">
              {/* Dummy: these responses will help seed AI critique prompts later. */}
              Provide additional context to help our models tailor their
              critique.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="emotions"
                  className="text-sm font-medium text-slate-700"
                >
                  What emotions or reactions do you want your audience to feel?
                </label>
                <textarea
                  id="emotions"
                  rows={2}
                  value={context.emotion}
                  onChange={(event) =>
                    setContext((prev) => ({
                      ...prev,
                      emotion: event.target.value,
                    }))
                  }
                  placeholder="E.g., inspired, curious, reassured."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="success"
                  className="text-sm font-medium text-slate-700"
                >
                  What does success look like for this campaign?
                </label>
                <textarea
                  id="success"
                  rows={2}
                  value={context.success}
                  onChange={(event) =>
                    setContext((prev) => ({
                      ...prev,
                      success: event.target.value,
                    }))
                  }
                  placeholder="E.g., hitting 5% CTR, 200 signups in 2 weeks, improved brand recall."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="inspirations"
                  className="text-sm font-medium text-slate-700"
                >
                  Are there any design or messaging inspirations to keep in
                  mind?
                </label>
                <textarea
                  id="inspirations"
                  rows={2}
                  value={context.inspiration}
                  onChange={(event) =>
                    setContext((prev) => ({
                      ...prev,
                      inspiration: event.target.value,
                    }))
                  }
                  placeholder="Share references, brands, or campaigns we should consider."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>
          </section>

          <div className="border-t border-slate-200" />

          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <p className="text-xs text-slate-400">
              {error ? (
                <span className="text-red-500">{error}</span>
              ) : (
                "We’ll use this information to personalize critique recommendations."
              )}
            </p>
            <button
              type="submit"
              className="w-full rounded-full bg-accent px-8 py-3 text-base font-medium text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
              disabled={isInvalid || isCreating}
            >
              {isCreating ? "Creating..." : "Create Campaign"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
