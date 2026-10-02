const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

export type StreakSummary = {
  currentStreak: number;
  longestStreak: number;
  todayCount: number;
  countsByDate: Record<string, number>;
};

export type WeekDay = {
  date: string;
  label: string;
  count: number;
  isToday: boolean;
  isFuture: boolean;
};

export function isValidDateKey(value: string): boolean {
  const match = DATE_KEY.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day
  );
}

export function shiftDateKey(dateKey: string, days: number): string {
  if (!isValidDateKey(dateKey) || !Number.isFinite(days)) {
    throw new Error(`Invalid date shift: ${dateKey} ${days}`);
  }
  const [year, month, day] = dateKey.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dateKeyFromTimestamp(timestamp: number, timeZone?: string): string {
  const zone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestamp));
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  if (!year || !month || !day) {
    throw new Error('Could not format a calendar day');
  }
  return `${year}-${month}-${day}`;
}

function countBackward(counts: Record<string, number>, startKey: string): number {
  let streak = 0;
  let cursor = startKey;
  while ((counts[cursor] ?? 0) >= 1) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }
  return streak;
}

function longestRun(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0;
  let longest = 1;
  let run = 1;
  for (let index = 1; index < sortedDates.length; index += 1) {
    const previous = sortedDates[index - 1];
    const current = sortedDates[index];
    if (previous && current && shiftDateKey(previous, 1) === current) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  return longest;
}

/**
 * A day counts when it has at least one completed pause.
 * The current streak runs through today, or through yesterday when today
 * has no pause yet, so the streak is not lost before the day ends.
 */
export function summarizeStreak(completionDateKeys: string[], todayKey: string): StreakSummary {
  if (!isValidDateKey(todayKey)) {
    return { currentStreak: 0, longestStreak: 0, todayCount: 0, countsByDate: {} };
  }

  const countsByDate: Record<string, number> = {};
  for (const key of completionDateKeys) {
    if (!isValidDateKey(key) || key > todayKey) continue;
    countsByDate[key] = (countsByDate[key] ?? 0) + 1;
  }

  const todayCount = countsByDate[todayKey] ?? 0;
  const activeDates = Object.keys(countsByDate)
    .filter((key) => (countsByDate[key] ?? 0) >= 1)
    .sort();
  const anchor = todayCount > 0 ? todayKey : shiftDateKey(todayKey, -1);

  return {
    currentStreak: countBackward(countsByDate, anchor),
    longestStreak: longestRun(activeDates),
    todayCount,
    countsByDate,
  };
}

export function buildWeekStrip(todayKey: string, countsByDate: Record<string, number>): WeekDay[] {
  if (!isValidDateKey(todayKey)) return [];
  const [year, month, day] = todayKey.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = shiftDateKey(todayKey, mondayOffset);

  return WEEKDAY_LABELS.map((label, index) => {
    const date = shiftDateKey(monday, index);
    return {
      date,
      label,
      count: countsByDate[date] ?? 0,
      isToday: date === todayKey,
      isFuture: date > todayKey,
    };
  });
}
