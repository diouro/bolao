import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/button";
import { CountryFlag } from "@/components/country-flag";
import { ResultForm } from "@/components/result-form";
import { Badge, Card } from "@/components/ui";
import { syncFinishedResults } from "@/app/(app)/admin/results/actions";
import { requireAdmin } from "@/lib/auth";
import { formatAppDateTime } from "@/lib/dates";
import { t, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getAllMatches } from "@/lib/matches";
import { resolveMatchSide } from "@/lib/tournament/resolve-slots";
import type { Match } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminResultsPage() {
  const profile = await requireAdmin();
  const locale = await getLocale();
  const matches = await getAllMatches();
  const nowMs = new Date().getTime();
  const matchesToShow = matches.filter((match) => {
    const kickoff = new Date(match.kickoff_at).getTime();
    return kickoff <= nowMs || match.status === "finished";
  });

  return (
    <AppShell profile={profile} active="admin">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            {t(locale, "admin.eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
            {t(locale, "admin.title")}
          </h1>
        </div>
        <form action={syncFinishedResults}>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            pendingChildren={t(locale, "admin.syncing")}
          >
            {t(locale, "admin.sync")}
          </Button>
        </form>
      </div>

      <div className="grid gap-4">
        {matchesToShow.length > 0 ? (
          matchesToShow.map((match) => (
            <ResultRow key={match.id} match={match} locale={locale} />
          ))
        ) : (
          <Card>
            <p className="font-semibold text-zinc-950">{t(locale, "admin.empty.title")}</p>
            <p className="mt-2 text-sm text-zinc-600">
              {t(locale, "admin.empty.body")}
            </p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function ResultRow({ match, locale }: { match: Match; locale: Locale }) {
  const home = resolveMatchSide(match, "home");
  const away = resolveMatchSide(match, "away");

  return (
    <Card className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="mb-3 flex flex-wrap gap-2">
          <Badge>{match.status}</Badge>
          {match.group_code && <Badge>Group {match.group_code}</Badge>}
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Team name={home.name} code={home.code} slot={home.slot} />
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-black text-zinc-700">
            vs
          </span>
          <Team
            name={away.name}
            code={away.code}
            slot={away.slot}
            align="right"
          />
        </div>
        <time className="mt-3 block text-sm text-zinc-500">
          {formatAppDateTime(match.kickoff_at)}
        </time>
      </div>
      <ResultForm match={match} locale={locale} />
    </Card>
  );
}

function Team({
  name,
  code,
  slot,
  align = "left",
}: {
  name: string;
  code: string | null;
  slot: string | null;
  align?: "left" | "right";
}) {
  return (
    <div
      className={
        align === "right"
          ? "flex min-w-0 flex-row-reverse items-center gap-3 text-right"
          : "flex min-w-0 items-center gap-3"
      }
    >
      <CountryFlag code={code} slot={slot} />
      <div className="min-w-0">
        <div className="truncate font-bold text-zinc-950">{name}</div>
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          {code ?? slot ?? "TBD"}
        </div>
      </div>
    </div>
  );
}
