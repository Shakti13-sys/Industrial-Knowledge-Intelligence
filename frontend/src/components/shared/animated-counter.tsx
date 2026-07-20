import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  duration = 0.4, // Reduced duration for crisp instant numbers
  className,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(() => format(value));
  const prevValueRef = useRef(value);

  useEffect(() => {
    // Value change nahi hui toh animation run mat karo (prevents flickering)
    if (prevValueRef.current === value && display === format(value)) return;
    prevValueRef.current = value;

    let raf = 0;
    const startValue = 0;
    const endValue = typeof value === 'number' && !isNaN(value) ? value : 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
      const currentValue = startValue + (endValue - startValue) * eased;
      
      setDisplay(format(currentValue));

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}