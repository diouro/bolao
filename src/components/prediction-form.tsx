import { savePrediction } from "@/app/(app)/predictions/actions";
import { Button } from "@/components/button";
import { PendingForm } from "@/components/pending-form";
import { Input } from "@/components/ui";
import { formatPredictionLockLabel } from "@/lib/predictions/lock";
import type { Prediction } from "@/lib/types";

export function PredictionForm({
  matchId,
  prediction,
  locked,
  lockMinutes,
}: {
  matchId: string;
  prediction?: Prediction | null;
  locked: boolean;
  lockMinutes: number;
}) {
  const hasSavedPrediction = Boolean(prediction);

  if (locked) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Your prediction
        </div>
        <div className="mt-1 text-sm font-bold text-zinc-700">
          {prediction
            ? `${prediction.home_score} - ${prediction.away_score}`
            : `Locked ${formatPredictionLockLabel(lockMinutes)}`}
        </div>
      </div>
    );
  }

  return (
    <PendingForm
      action={savePrediction}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <input type="hidden" name="matchId" value={matchId} />
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Your prediction
        </div>
        <div className="mt-2 flex items-center gap-2">
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
            className="mt-0 h-14 w-16 rounded-2xl border-zinc-300 bg-white text-center text-xl font-black shadow-sm sm:w-20"
            required
          />
          <span className="text-lg font-black text-zinc-300">-</span>
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
            className="mt-0 h-14 w-16 rounded-2xl border-zinc-300 bg-white text-center text-xl font-black shadow-sm sm:w-20"
            required
          />
        </div>
      </div>
      <Button
        className={
          hasSavedPrediction
            ? "h-12 bg-amber-500 px-6 text-zinc-950 hover:bg-amber-400"
            : "h-12 bg-emerald-600 px-6 hover:bg-emerald-700"
        }
        pendingChildren={hasSavedPrediction ? "Updating" : "Saving"}
      >
        {hasSavedPrediction ? "Update" : "Save"}
      </Button>
    </PendingForm>
  );
}
