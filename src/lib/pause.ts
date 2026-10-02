export const MIN_PAUSE_SECONDS = 30;
export const MAX_PAUSE_SECONDS = 90;
export const DEFAULT_PAUSE_SECONDS = 45;
export const PAUSE_STEP_SECONDS = 5;

export function clampPauseDuration(seconds: number): number {
  if (!Number.isFinite(seconds)) return DEFAULT_PAUSE_SECONDS;
  const stepped = Math.round(seconds / PAUSE_STEP_SECONDS) * PAUSE_STEP_SECONDS;
  return Math.min(MAX_PAUSE_SECONDS, Math.max(MIN_PAUSE_SECONDS, stepped));
}

export type PauseWindow = {
  startedAt: number;
  endsAt: number;
  durationSec: number;
};

/**
 * The countdown is always `endsAt - now`. Storing a remaining-seconds counter
 * would drift while the app is backgrounded; an absolute end time does not.
 */
export function createPauseWindow(now: number, durationSec: number): PauseWindow {
  const duration = clampPauseDuration(durationSec);
  return {
    startedAt: now,
    endsAt: now + duration * 1000,
    durationSec: duration,
  };
}

export function remainingMs(endsAt: number, now: number): number {
  if (!Number.isFinite(endsAt) || !Number.isFinite(now)) return 0;
  return Math.max(0, endsAt - now);
}

export function canOfferScrollChoice(endsAt: number, now: number): boolean {
  return Number.isFinite(endsAt) && Number.isFinite(now) && now >= endsAt;
}

export function shouldRecordCompletion(input: {
  endsAt: number;
  now: number;
  alreadyRecorded: boolean;
}): boolean {
  if (input.alreadyRecorded) return false;
  return canOfferScrollChoice(input.endsAt, input.now);
}

export function completionCountsForStreak(session: {
  completedAt: number | null | undefined;
  endsAt: number;
}): boolean {
  if (session.completedAt == null) return false;
  if (!Number.isFinite(session.completedAt) || !Number.isFinite(session.endsAt)) return false;
  return session.completedAt >= session.endsAt;
}

/**
 * Streak credit uses the moment the timer finished, not when the app next
 * opened. A late relaunch cannot move the pause onto a different day.
 */
export function streakCreditTimestamp(session: {
  completedAt: number | null | undefined;
  endsAt: number;
}): number | null {
  if (!completionCountsForStreak(session)) return null;
  return session.endsAt;
}
