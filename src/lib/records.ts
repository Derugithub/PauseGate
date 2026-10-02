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
