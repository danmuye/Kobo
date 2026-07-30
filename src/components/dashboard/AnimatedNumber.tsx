import { useEffect, useState } from "react";
import { useMotionValue, animate, useReducedMotion } from "framer-motion";
import { ease } from "./motion-variants";

interface AnimatedNumberProps {
  value: number;
  format?: (v: number) => string;
  duration?: number;
}

export function AnimatedNumber({ value, format, duration = 0.3 }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const motionValue = useMotionValue(value);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) {
      setDisplay(value);
      return;
    }
    motionValue.set(0);
    const controls = animate(motionValue, value, {
      duration,
      ease,
    });

    const unsubscribe = motionValue.on("change", (latest) => {
      setDisplay(Math.round(latest));
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, duration, prefersReduced]);

  if (format) return <>{format(display)}</>;
  return <>{display}</>;
}
