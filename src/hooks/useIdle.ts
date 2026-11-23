/*
  File Path: src/hooks/useIdle.ts
  File Description: Calls onIdle after `ms` without a touch. Spread the returned props onto a wrapping View;
  any touch inside it restarts the timer (without stealing the touch from children).
*/
import { useCallback, useEffect, useRef } from "react";
import type { GestureResponderEvent } from "react-native";

export function useIdle(ms: number, onIdle: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cb = useRef(onIdle);
  cb.current = onIdle;

  const restart = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => cb.current(), ms);
  }, [ms]);

  useEffect(() => {
    restart();
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [restart]);

  return {
    // Capture phase: runs for every touch, returns false so the child still gets it
    onStartShouldSetResponderCapture: (_e: GestureResponderEvent) => { restart(); return false; },
    onTouchStart: restart,
  };
}
