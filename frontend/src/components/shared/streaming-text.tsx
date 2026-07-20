import { useEffect, useRef, useState } from 'react';

interface StreamingTextProps {
  text: string;
  speed?: number;
  onDone?: () => void;
  className?: string;
}

export function StreamingText({ text, speed = 12, onDone, className }: StreamingTextProps) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    setDisplayed('');
    indexRef.current = 0;
    doneRef.current = false;
    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(interval);
        if (!doneRef.current) {
          doneRef.current = true;
          onDone?.();
        }
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onDone]);

  return (
    <span className={className}>
      {displayed}
      <span className="ml-0.5 inline-block h-3.5 w-0.5 bg-copper align-middle animate-pulse" />
    </span>
  );
}
