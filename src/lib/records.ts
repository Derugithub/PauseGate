import { shouldRecordCompletion, streakCreditTimestamp } from './pause';
import { dateKeyFromTimestamp } from './streaks';
import { MAX_SESSIONS, type PauseRecord, type PersistedState } from './types';

export function withCompletion(state: PersistedState, now: number): PersistedState {
  const active = state.active;
  if (!active) return state;

  const alreadyRecorded = state.sessions.some((session) => session.id === active.id);
  if (alreadyRecorded) {
    return { ...state, active: null };
  }
  if (!shouldRecordCompletion({ endsAt: active.endsAt, now, alreadyRecorded: false })) {
    return state;
  }

  const record: PauseRecord = {
    id: active.id,
    startedAt: active.startedAt,
    endsAt: active.endsAt,
    completedAt: now,
    durationSec: active.durationSec,
    habits: active.habits,
    checkIn: null,
  };

  return {
    ...state,
    active: null,
    sessions: [record, ...state.sessions].slice(0, MAX_SESSIONS),
  };
}

const HYDRATE_REDIRECT_MS = 5000;

/**
 * Where to send the user when a pause has just been logged.
 * A running pause that is replaced by a new one stays put — only a cleared
 * active pause opens the completion moment. On the first snapshot after load,
 * a session recorded in the last few seconds is one that ended while the app
 * was closed.
 */
export function completionRedirectId(
  previousActiveId: string | null | undefined,
  state: {
    active: { id: string } | null;
    sessions: { id: string; completedAt: number; checkIn: string | null }[];
  },
  now: number,
): string | null {
  if (previousActiveId === undefined) {
    const latest = state.sessions[0];
    if (!latest || state.active || latest.checkIn != null) return null;
    if (now - latest.completedAt > HYDRATE_REDIRECT_MS || now < latest.completedAt) return null;
    return latest.id;
  }
  if (!previousActiveId || state.active) return null;
  return state.sessions.some((session) => session.id === previousActiveId) ? previousActiveId : null;
}

export function completionDateKeys(
  sessions: { completedAt: number | null | undefined; endsAt: number }[],
  timeZone?: string,
): string[] {
  const keys: string[] = [];
  for (const session of sessions) {
    const credit = streakCreditTimestamp(session);
    if (credit == null) continue;
    keys.push(dateKeyFromTimestamp(credit, timeZone));
  }
  return keys;
}
