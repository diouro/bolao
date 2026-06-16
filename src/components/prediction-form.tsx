import { savePrediction } from "@/app/(app)/predictions/actions";
import { Button } from "@/components/button";
import { PendingForm } from "@/components/pending-form";
import { Input } from "@/components/ui";
import type { Prediction } from "@/lib/types";

export function PredictionForm({
  matchId,
  prediction,
  locked,
}: {
  matchId: string;
  prediction?: Prediction | null;
  locked: boolean;
}) {
  if (locked) {
    return (
      <div className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-600">
        {prediction
          ? `Your pick: ${prediction.home_score}-${prediction.away_score}`
          : "Predictions locked"}
      </div>
    );
  }

  return (
    <PendingForm action={savePrediction} className="flex items-end gap-2">
      <input type="hidden" name="matchId" value={matchId} />
      <label className="sr-only" htmlFor={`${matchId}-home`}>
        Home score
      </label>
      <Input
        id={`${matchId}-home`}
        name="homeScore"
        type="number"
        min={0}
        max={30}
        defaultValue={prediction?.home_score ?? ""}
        className="mt-0 w-20 text-center"
        required
      />
      <span className="pb-3 text-sm font-bold text-zinc-400">-</span>
      <label className="sr-only" htmlFor={`${matchId}-away`}>
        Away score
      </label>
      <Input
        id={`${matchId}-away`}
        name="awayScore"
        type="number"
        min={0}
        max={30}
        defaultValue={prediction?.away_score ?? ""}
        className="mt-0 w-20 text-center"
        required
      />
      <Button
        className="h-11 bg-emerald-600 px-4 hover:bg-emerald-700"
        pendingChildren="Saving"
      >
        Save
      </Button>
    </PendingForm>
  );
}
