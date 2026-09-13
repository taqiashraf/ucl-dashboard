import { useEffect, useRef } from 'react';
import type { Score } from '../types';
export function ScoreValue({ score }: { score: Score }) {
  const element = useRef<HTMLSpanElement>(null);
  const value = `${score.home}:${score.away}`;
  const previous = useRef(value);
  useEffect(() => {
    if (
      previous.current !== value &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      element.current?.animate(
        [{ backgroundColor: '#698deb66' }, { backgroundColor: 'transparent' }],
        { duration: 1200 },
      );
    }
    previous.current = value;
  }, [value]);
  return (
    <span ref={element} className="score-value">
      {score.home ?? '–'}
      <span className="score-dash">–</span>
      {score.away ?? '–'}
    </span>
  );
}
