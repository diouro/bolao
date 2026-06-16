export const DEFAULT_PREDICTION_LOCK_MINUTES = 5;

export function normalizePredictionLockMinutes(value: unknown) {
  const minutes = Number(value);

  if (!Number.isFinite(minutes) || minutes < 0) {
    return DEFAULT_PREDICTION_LOCK_MINUTES;
  }

  return Math.floor(minutes);
}

export function getPredictionLockCutoff(kickoffAt: string, lockMinutes: number) {
  return new Date(kickoffAt).getTime() - lockMinutes * 60 * 1000;
}

export function isPredictionLocked({
  kickoffAt,
  lockMinutes,
  now = new Date(),
}: {
  kickoffAt: string;
  lockMinutes: number;
  now?: Date;
}) {
  return getPredictionLockCutoff(kickoffAt, lockMinutes) <= now.getTime();
}

export function isPredictionEditable({
  kickoffAt,
  lockMinutes,
  now = new Date(),
}: {
  kickoffAt: string;
  lockMinutes: number;
  now?: Date;
}) {
  return !isPredictionLocked({ kickoffAt, lockMinutes, now });
}

export function formatPredictionLockLabel(lockMinutes: number) {
  if (lockMinutes === 0) {
    return "at kickoff";
  }

  if (lockMinutes === 1) {
    return "1 minute before kickoff";
  }

  return `${lockMinutes} minutes before kickoff`;
}
