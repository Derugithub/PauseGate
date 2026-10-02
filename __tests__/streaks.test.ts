import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildWeekStrip,
  dateKeyFromTimestamp,
  isValidDateKey,
  shiftDateKey,
  summarizeStreak,
} from '../src/lib/streaks.ts';

describe('calendar keys', () => {
  it('shifts across months, years, and leap day without drifting', () => {
    assert.equal(shiftDateKey('2025-12-31', 1), '2026-01-01');
    assert.equal(shiftDateKey('2026-01-01', -1), '2025-12-31');
    assert.equal(shiftDateKey('2026-03-01', -1), '2026-02-28');
    assert.equal(shiftDateKey('2024-02-28', 1), '2024-02-29');
    assert.equal(shiftDateKey('2024-02-29', 1), '2024-03-01');
  });

  it('rejects dates that are not real calendar days', () => {
    assert.equal(isValidDateKey('2026-10-02'), true);
    assert.equal(isValidDateKey('2026-02-31'), false);
    assert.equal(isValidDateKey('2026-13-01'), false);
    assert.equal(isValidDateKey(''), false);
  });

  it('buckets a timestamp by the requested timezone', () => {
    const instant = Date.UTC(2026, 9, 2, 3, 30, 0);
    assert.equal(dateKeyFromTimestamp(instant, 'UTC'), '2026-10-02');
    assert.equal(dateKeyFromTimestamp(instant, 'America/New_York'), '2026-10-01');
  });
});

describe('summarizeStreak', () => {
  it('returns zeros when nothing is completed', () => {
    const summary = summarizeStreak([], '2026-10-02');
    assert.deepEqual(summary, {
      currentStreak: 0,
      longestStreak: 0,
      todayCount: 0,
      countsByDate: {},
    });
  });

  it('counts several pauses today as one streak day', () => {
    const summary = summarizeStreak(['2026-10-02', '2026-10-02', '2026-10-02'], '2026-10-02');
    assert.equal(summary.todayCount, 3);
    assert.equal(summary.currentStreak, 1);
    assert.equal(summary.longestStreak, 1);
  });

  it('keeps the streak through yesterday when today has no pause yet', () => {
    const summary = summarizeStreak(['2026-09-30', '2026-10-01', '2026-10-01'], '2026-10-02');
    assert.equal(summary.todayCount, 0);
    assert.equal(summary.currentStreak, 2);
    assert.equal(summary.longestStreak, 2);
  });

  it('breaks the current streak when yesterday was missed', () => {
    const summary = summarizeStreak(['2026-09-30', '2026-10-02'], '2026-10-02');
    assert.equal(summary.currentStreak, 1);
    assert.equal(summary.longestStreak, 1);
    assert.equal(summary.todayCount, 1);
  });

  it('ends the streak after a full missed day', () => {
    const summary = summarizeStreak(['2026-09-30'], '2026-10-02');
    assert.equal(summary.currentStreak, 0);
    assert.equal(summary.longestStreak, 1);
    assert.equal(summary.todayCount, 0);
  });

  it('keeps the longest run when the current run is shorter', () => {
    const older = ['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05'];
    const current = ['2026-10-01', '2026-10-02'];
    const summary = summarizeStreak([...current, ...older], '2026-10-02');
    assert.equal(summary.currentStreak, 2);
    assert.equal(summary.longestStreak, 5);
    assert.equal(summary.todayCount, 1);
  });

  it('counts a streak across a leap day and a month boundary', () => {
    const summary = summarizeStreak(['2024-02-28', '2024-02-29', '2024-03-01'], '2024-03-01');
    assert.equal(summary.currentStreak, 3);
    assert.equal(summary.longestStreak, 3);
  });

  it('ignores future days and invalid keys', () => {
    const summary = summarizeStreak(['2026-10-02', '2026-10-03', '2026-02-31', 'nope'], '2026-10-02');
    assert.equal(summary.todayCount, 1);
    assert.equal(summary.currentStreak, 1);
    assert.equal(summary.longestStreak, 1);
    assert.deepEqual(Object.keys(summary.countsByDate), ['2026-10-02']);
  });

  it('returns an empty summary for a bad today key', () => {
    const summary = summarizeStreak(['2026-10-02'], '2026-02-31');
    assert.equal(summary.currentStreak, 0);
    assert.equal(summary.todayCount, 0);
  });
});

describe('buildWeekStrip', () => {
  it('builds a Monday-start week and marks days after today as ahead', () => {
    const strip = buildWeekStrip('2026-10-02', { '2026-10-02': 2, '2026-09-28': 1 });
    assert.deepEqual(
      strip.map((day) => day.date),
      ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'],
    );
    assert.deepEqual(
      strip.map((day) => day.label),
      ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    );
    assert.equal(strip[4]?.isToday, true);
    assert.equal(strip[4]?.count, 2);
    assert.equal(strip[0]?.count, 1);
    assert.equal(strip[5]?.isFuture, true);
    assert.equal(strip[6]?.isFuture, true);
    assert.equal(strip[3]?.isFuture, false);
  });
});
