/**
 * SpeedIndicator: shows current speed centered on screen when changed.
 * Auto-fades after 1s.
 */

import { useEffect, useState, useRef } from "react";

interface SpeedIndicatorProps {
  speed: number;
}

export function SpeedIndicator({ speed }: SpeedIndicatorProps) {
  const [visible, setVisible] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Don't show on initial mount (default speed)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1000);
    return () => clearTimeout(timer);
  }, [speed]);

  if (!visible) return null;

  const label = speed === 1 ? "1x" : `${speed}x`;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-6 py-4 animate-[fadeInOut_1s_ease-in-out]">
        <span className="text-white text-2xl font-bold">{label}</span>
      </div>
    </div>
  );
}
