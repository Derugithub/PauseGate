import AsyncStorage from '@react-native-async-storage/async-storage';

import { sanitizeState } from './persist';
import { STORAGE_KEY, type PersistedState } from './types';

export async function loadState(): Promise<PersistedState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return sanitizeState(null);
    return sanitizeState(JSON.parse(raw) as unknown);
  } catch {
    return sanitizeState(null);
  }
}

export async function saveState(state: PersistedState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
