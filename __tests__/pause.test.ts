import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatRemaining } from '../src/lib/format.ts';
import {
  canOfferScrollChoice,
  clampPauseDuration,
  completionCountsForStreak,
  createPauseWindow,
  DEFAULT_PAUSE_SECONDS,
  MAX_PAUSE_SECONDS,
  MIN_PAUSE_SECONDS,
  remainingMs,
  shouldRecordCompletion,
  streakCreditTimestamp,
} from '../src/lib/pause.ts';
import { defaultState, sanitizeState } from '../src/lib/persist.ts';
import { completionDateKeys, completionRedirectId, withCompletion } from '../src/lib/records.ts';
import { dateKeyFromTimestamp } from '../src/lib/streaks.ts';

describe('pause duration', () => {
  it('clamps to the 30–90 second range on a 5 second step', () => {
    assert.equal(clampPauseDuration(45), 45);
    assert.equal(clampPauseDuration(30), MIN_PAUSE_SECONDS);
    assert.equal(clampPauseDuration(90), MAX_PAUSE_SECONDS);
    assert.equal(clampPauseDuration(29), 30);
    assert.equal(clampPauseDuration(0), 30);
    assert.equal(clampPauseDuration(-10), 30);
    assert.equal(clampPauseDuration(91), 90);
    assert.equal(clampPauseDuration(1000), 90);
    assert.equal(clampPauseDuration(42), 40);
    assert.equal(clampPauseDuration(44), 45);
    assert.equal(clampPauseDuration(48), 50);
    assert.equal(clampPauseDuration(Number.NaN), DEFAULT_PAUSE_SECONDS);
  });

  it('builds an absolute window from the start instant', () => {
    const start = 1_800_000_000_000;
    const window = createPauseWindow(start, 45);
    assert.equal(window.startedAt, start);
    assert.equal(window.endsAt, start + 45_000);
    assert.equal(window.durationSec, 45);
    assert.equal(createPauseWindow(start, 12).durationSec, 30);
  });
});

describe('countdown and completion', () => {
  const start = 1_800_000_000_000;
  const window = createPauseWindow(start, 45);

  it('measures remaining time from the end instant after a background gap', () => {
    let cursor = start;
    for (let tick = 0; tick < 20; tick += 1) cursor += 1000;
    cursor += 15_000;
    assert.equal(remainingMs(window.endsAt, cursor), 10_000);
    assert.equal(canOfferScrollChoice(window.endsAt, cursor), false);
  });

  it('shows the full second until it has actually elapsed', () => {
    assert.equal(formatRemaining(45_000), '00:45');
    assert.equal(formatRemaining(44_999), '00:45');
    assert.equal(formatRemaining(44_000), '00:44');
    assert.equal(formatRemaining(1), '00:01');
    assert.equal(formatRemaining(0), '00:00');
    assert.equal(formatRemaining(90_000), '01:30');
    assert.equal(formatRemaining(-5), '00:00');
  });

  it('locks the feed choice until the end instant', () => {
    assert.equal(canOfferScrollChoice(window.endsAt, window.endsAt - 1), false);
    assert.equal(canOfferScrollChoice(window.endsAt, window.endsAt), true);
    assert.equal(
      shouldRecordCompletion({ endsAt: window.endsAt, now: window.endsAt - 1, alreadyRecorded: false }),
      false,
    );
    assert.equal(
      shouldRecordCompletion({ endsAt: window.endsAt, now: window.endsAt, alreadyRecorded: false }),
      true,
    );
    assert.equal(
      shouldRecordCompletion({ endsAt: window.endsAt, now: window.endsAt + 5_000, alreadyRecorded: true }),
      false,
    );
  });

  it('does not count an early or missing completion toward a streak', () => {
    assert.equal(completionCountsForStreak({ completedAt: window.endsAt - 1, endsAt: window.endsAt }), false);
    assert.equal(completionCountsForStreak({ completedAt: null, endsAt: window.endsAt }), false);
    assert.equal(completionCountsForStreak({ completedAt: undefined, endsAt: window.endsAt }), false);
    assert.equal(completionCountsForStreak({ completedAt: window.endsAt, endsAt: window.endsAt }), true);
    assert.equal(streakCreditTimestamp({ completedAt: window.endsAt - 1, endsAt: window.endsAt }), null);
  });

  it('credits the day the timer finished, even if the app opens later', () => {
    const endsAt = Date.UTC(2026, 9, 2, 3, 59, 30);
    const completedAt = endsAt + 2 * 24 * 60 * 60 * 1000;
    const credit = streakCreditTimestamp({ completedAt, endsAt });
    assert.equal(credit, endsAt);
    assert.equal(dateKeyFromTimestamp(credit!, 'America/New_York'), '2026-10-01');
    assert.notEqual(
      dateKeyFromTimestamp(credit!, 'America/New_York'),
      dateKeyFromTimestamp(completedAt, 'America/New_York'),
    );
  });
});

describe('recording a pause', () => {
  it('refuses to record before the end and records once at the end', () => {
    const state = defaultState();
    const startedAt = 1_800_000_000_000;
    const active = {
      id: 'pause_1',
      startedAt,
      endsAt: startedAt + 45_000,
      durationSec: 45,
      habits: [{ id: 'breathe', label: 'Breathe 3×', done: true }],
    };
    const running = { ...state, active };

    assert.equal(withCompletion(running, startedAt + 44_999), running);

    const done = withCompletion(running, startedAt + 45_000);
    assert.equal(done.active, null);
    assert.equal(done.sessions.length, 1);
    assert.equal(done.sessions[0]?.completedAt, startedAt + 45_000);
    assert.equal(done.sessions[0]?.checkIn, null);
    assert.equal(streakCreditTimestamp(done.sessions[0]!), startedAt + 45_000);

    const duplicate = withCompletion({ ...done, active }, startedAt + 50_000);
    assert.equal(duplicate.sessions.length, 1);
    assert.equal(duplicate.active, null);
  });

  it('drops stored early completions and still records a pause that ended while closed', () => {
    const startedAt = Date.UTC(2026, 9, 1, 15, 0, 0);
    const endsAt = startedAt + 45_000;
    const cleaned = sanitizeState({
      settings: { pauseDurationSec: 45, onboardingComplete: true },
      sessions: [
        {
          id: 'early',
          startedAt,
          endsAt,
          completedAt: endsAt - 1,
          durationSec: 45,
          habits: [],
          checkIn: 'opened',
        },
      ],
      active: {
        id: 'closed',
        startedAt: endsAt,
        endsAt: endsAt + 30_000,
        durationSec: 30,
        habits: [],
      },
    });

    assert.equal(cleaned.sessions.length, 0);
    assert.equal(cleaned.active?.id, 'closed');
    assert.equal(cleaned.settings.onboardingComplete, true);

    const recorded = withCompletion(cleaned, endsAt + 30_000 + 86_400_000);
    assert.equal(recorded.active, null);
    assert.equal(recorded.sessions.length, 1);
    assert.deepEqual(completionDateKeys(recorded.sessions, 'UTC'), [
      dateKeyFromTimestamp(endsAt + 30_000, 'UTC'),
    ]);
  });
});

describe('completion redirect', () => {
  const session = {
    id: 'pause-1',
    completedAt: 1_000_000,
    checkIn: null,
  };

  it('opens the completion moment when the running pause is logged', () => {
    assert.equal(
      completionRedirectId('pause-1', { active: null, sessions: [session] }, session.completedAt),
      'pause-1',
    );
  });

  it('stays on a new pause when the previous one was logged in the same update', () => {
    assert.equal(
      completionRedirectId('pause-1', { active: { id: 'pause-2' }, sessions: [session] }, session.completedAt),
      null,
    );
  });

  it('shows a pause that was logged while the app was closed', () => {
    assert.equal(
      completionRedirectId(undefined, { active: null, sessions: [session] }, session.completedAt + 1000),
      'pause-1',
    );
  });

  it('does not reopen an older pause that was already left', () => {
    assert.equal(
      completionRedirectId(undefined, { active: null, sessions: [session] }, session.completedAt + 60_000),
      null,
    );
    assert.equal(
      completionRedirectId(null, { active: null, sessions: [{ ...session, checkIn: 'stayed' }] }, session.completedAt),
      null,
    );
  });
});
