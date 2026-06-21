// SweepInput.ts — keyboard shortcuts for Sweep.
// R = restart standard board, D = start a Daily Seed board.
// Shift hold is tracked inside the scene root for chord-on-left-click;
// this file only handles non-modifier shortcuts.

import { useEffect } from 'react';

type Props = {
  onNewGame: (daily: boolean) => void;
};

export function SweepInput({ onNewGame }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onNewGame(false);
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        onNewGame(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onNewGame]);
  return null;
}
