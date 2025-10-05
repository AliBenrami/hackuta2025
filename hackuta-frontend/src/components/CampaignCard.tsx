export interface Campaign {
  id: number;
  name: string;
  goal?: string;
  platform?: string;
  description?: string;
  context?: {
    emotions?: string;
    success?: string;
    inspirations?: string;
  };
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-accent/60 hover:shadow-lg hover:shadow-accent/15">
      <div className="space-y-3">
        <h2 className="text-lg font-heading font-semibold text-navy">{campaign.name}</h2>
        <p className="text-sm font-medium text-slate-500">{campaign.goal}</p>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{campaign.platform}</p>
      </div>
      {campaign.description && (
        // Dummy: placeholder campaign description preview
        <p className="mt-6 text-sm leading-6 text-slate-600 line-clamp-3">{campaign.description}</p>
      )}
      <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
        {/* Dummy: placeholder sync timestamp */}
        <span>Last synced · 2h ago</span>
        {/* Dummy: placeholder navigation affordance */}
        <span className="font-medium text-accent">View details →</span>
      </div>
      {/* TODO [backend integration plan]
          1. Replace local mock data with CockroachDB queries via FastAPI microservice.
          2. Introduce organization_id and user_id for scoped campaigns.
          3. Add NextAuth.js for login and user session management.
          4. Implement /api/analyze and /api/fetch-metrics endpoints for campaign analysis.
        */}
    </article>
  );
}

