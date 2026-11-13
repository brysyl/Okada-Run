import { useEffect, useRef, type RefObject } from 'react';

const THRESHOLD = 28;

/** Horizontal swipe detection (touch + pointer) on an element. */
export function useSwipe(
  target: RefObject<HTMLElement>,
  onLeft: () => void,
  onRight: () => void,
): void {
  const cb = useRef({ onLeft, onRight });
  cb.current = { onLeft, onRight };

  useEffect(() => {
    const el = target.current;
    if (!el) return;
    let startX = 0;
    let startY = 0;
    let tracking = false;
    const start = (e: TouchEvent) => {
      const t = e.touches[0];
      startX = t.clientX; startY = t.clientY; tracking = true;
    };
    const move = (e: TouchEvent) => {
      if (!tracking) return;
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - startX;
      if (Math.abs(dx) > THRESHOLD && Math.abs(dx) > Math.abs(t.clientY - startY)) {
        (dx < 0 ? cb.current.onLeft : cb.current.onRight)();
        startX = t.clientX; startY = t.clientY; // allow chained swipes
      }
    };
    const end = () => { tracking = false; };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', end);
    };
  }, [target]);
}
