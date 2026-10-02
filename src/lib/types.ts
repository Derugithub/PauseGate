export type CheckIn = 'opened' | 'stayed';

export type Habit = {
  id: string;
  label: string;
  enabled: boolean;
  builtIn: boolean;
};

export type Settings = {
  pauseDurationSec: number;
  hapticsEnabled: boolean;
  remindersEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  onboardingComplete: boolean;
};

export type HabitSnapshot = {
  id: string;
  label: string;
  done: boolean;
};

export type ActivePause = {
  id: string;
  startedAt: number;
  endsAt: number;
  durationSec: number;
  habits: HabitSnapshot[];
};

export type PauseRecord = {
  id: string;
  startedAt: number;
  endsAt: number;
  completedAt: number;
  durationSec: number;
  habits: HabitSnapshot[];
  checkIn: CheckIn | null;
};

export type PersistedState = {
  version: 1;
  settings: Settings;
  habits: Habit[];
  sessions: PauseRecord[];
  active: ActivePause | null;
};

export const MAX_HABITS = 8;
export const MAX_SESSIONS = 400;
export const MAX_LABEL_LENGTH = 48;
export const STORAGE_KEY = 'pausegate.v1';
