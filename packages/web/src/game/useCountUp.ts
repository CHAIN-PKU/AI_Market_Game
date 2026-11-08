import { useEffect, useRef, useState } from 'react';

/**
 * 数字滚动：值从 0 递增到 target，节奏接近剪映的「数字跳一下」。
 * 用 rAF 而不是 CSS transition，才能在任意时刻准确停在整数上。
 */
export function useCountUp(target: number, active: boolean, duration = 620): number {
  const [value, setValue] = useState(0);
  const startRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    startRef.current = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - startRef.current) / duration);
      // easeOutCubic：先快后慢，收尾稳
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, active, duration]);

  return value;
}
