// filepath: src/lib/use-count-up.ts
//
// Tiny helper that tweens a number from 0 → `value` over `duration` ms
// using react-native-reanimated. Returns the latest value as a React
// state value so the component can re-render with the new number.
//
// This drives the dashboard's "annual leave remaining" counter, the
// ring percentage, and any other number we want to count up on mount.

import { useEffect, useRef, useState } from 'react';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

export function useCountUp(value: number, duration = 700): number {
  const shared = useSharedValue(0);
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    // Start the worklet tween. We deliberately animate from the previous
    // display value so that re-renders (e.g. when more leave is taken)
    // continue smoothly rather than snapping back to zero.
    shared.value = previous.current;
    shared.value = withTiming(
      value,
      { duration, easing: Easing.out(Easing.cubic) },
      (finished) => {
        'worklet';
        if (finished) {
          // scheduleOnRN would be ideal but a plain setState from a
          // worklet callback is also fine for one-shot final values.
        }
      },
    );

    // Drive a JS-side mirror via requestAnimationFrame. This is cheaper
    // than scheduling a worklet → RN hop on every frame for a small UI
    // counter like ours.
    let raf = 0;
    const start = performance.now();
    const from = previous.current;
    const tick = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (value - from) * eased;
      previous.current = next;
      setDisplay(next);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        previous.current = value;
        setDisplay(value);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
    };
    // `shared` is a stable reference per hook call; intentionally not
    // listed as a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return display;
}
