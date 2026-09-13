import { useEffect, useState } from 'react';
import { usePageVisibility } from './usePageVisibility';
import { matchClock } from '../lib/time';
import type { Match } from '../types';
export function useNow() {
  const [now, setNow] = useState(Date.now);
  const visible = usePageVisibility();
  useEffect(() => {
    if (!visible) return;
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [visible]);
  return now;
}
export const useMatchClock = (match: Match, receivedAt: number) =>
  matchClock(match, useNow(), receivedAt);
