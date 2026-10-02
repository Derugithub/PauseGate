import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function useNow(running: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 250);
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') tick();
    });
    return () => {
      clearInterval(id);
      subscription.remove();
    };
  }, [running]);

  return now;
}
