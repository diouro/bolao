import { BracketLandscapeGate } from "@/components/bracket-landscape-gate";
import { TournamentBracket } from "@/components/tournament-bracket";
import { Card } from "@/components/ui";
import { getAllMatches } from "@/lib/matches";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function BracketPage() {
  const locale = await getLocale();
  const matches = await getAllMatches();
  const knockoutMatches = matches.filter((match) => match.round !== "group");

  return (
    <>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          {t(locale, "bracket.eyebrow")}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950">
          {t(locale, "bracket.title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          {t(locale, "bracket.subtitle")}
        </p>
      </div>

      {knockoutMatches.length > 0 ? (
        <BracketLandscapeGate locale={locale}>
          <Card className="p-4 sm:p-6">
            <TournamentBracket matches={knockoutMatches} locale={locale} />
          </Card>
        </BracketLandscapeGate>
      ) : (
        <Card>
          <p className="font-semibold text-zinc-950">
            {t(locale, "bracket.empty.title")}
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            {t(locale, "bracket.empty.body")}
          </p>
        </Card>
      )}
    </>
  );
}
