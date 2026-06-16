import { AppShell } from "@/components/app-shell";
import { StatsCards } from "@/components/stats-cards";
import { requireProfile } from "@/lib/auth";
import { computeStats } from "@/lib/stats/compute-stats";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const profile = await requireProfile();
  const summary = await computeStats(profile.id);

  return (
    <AppShell profile={profile} active="stats">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Fun stats
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          Beyond the table
        </h1>
      </div>

      <StatsCards summary={summary} />
    </AppShell>
  );
}
