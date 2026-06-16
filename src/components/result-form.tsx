import { saveResult } from "@/app/(app)/admin/results/actions";
import { Button } from "@/components/button";
import { PendingForm } from "@/components/pending-form";
import { Input } from "@/components/ui";
import { t, type Locale } from "@/lib/i18n";
import type { Match } from "@/lib/types";

export function ResultForm({ match, locale }: { match: Match; locale: Locale }) {
  return (
    <PendingForm action={saveResult} className="flex items-end gap-2">
      <input type="hidden" name="matchId" value={match.id} />
      <Input
        aria-label="Home score"
        name="homeScore"
        type="number"
        min={0}
        max={30}
        defaultValue={match.home_score ?? ""}
        className="mt-0 w-20 text-center"
        required
      />
      <span className="pb-3 text-sm font-bold text-zinc-400">-</span>
      <Input
        aria-label="Away score"
        name="awayScore"
        type="number"
        min={0}
        max={30}
        defaultValue={match.away_score ?? ""}
        className="mt-0 w-20 text-center"
        required
      />
      <Button
        pendingChildren={t(locale, "common.saving")}
        className="h-11 bg-emerald-600 hover:bg-emerald-700"
      >
        {t(locale, "common.save")}
      </Button>
    </PendingForm>
  );
}
