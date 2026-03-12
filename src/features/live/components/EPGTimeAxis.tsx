import { useEffect, useState, useMemo } from 'react';

interface EPGTimeAxisProps {
  startTime: Date;
  endTime: Date;
  pixelsPerMinute: number;
}

export function EPGTimeAxis({ startTime, endTime, pixelsPerMinute }: EPGTimeAxisProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const totalMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
  const totalWidth = totalMinutes * pixelsPerMinute;

  const slots = useMemo(() => {
    const result: { time: Date; label: string; offset: number }[] = [];
    // Round start to nearest 30-min boundary
    const slotStart = new Date(startTime);
    slotStart.setMinutes(Math.ceil(slotStart.getMinutes() / 30) * 30, 0, 0);

    let current = new Date(slotStart);
    while (current <= endTime) {
      const offset =
        ((current.getTime() - startTime.getTime()) / 60000) * pixelsPerMinute;
      const label = current.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      result.push({ time: new Date(current), label, offset });
      current = new Date(current.getTime() + 30 * 60000);
    }
    return result;
  }, [startTime, endTime, pixelsPerMinute]);

  const nowOffset =
    ((now.getTime() - startTime.getTime()) / 60000) * pixelsPerMinute;
  const showNowLine = now >= startTime && now <= endTime;

  return (
    <div className="relative h-8 border-b border-white/10" style={{ width: totalWidth }}>
      {slots.map((slot) => (
        <div
          key={slot.label}
          className="absolute top-0 h-full flex items-end pb-1"
          style={{ left: slot.offset }}
        >
          <div className="w-px h-3 bg-white/20" />
          <span className="text-[10px] text-text-muted ml-1 select-none">
            {slot.label}
          </span>
        </div>
      ))}

      {/* Now line */}
      {showNowLine && (
        <div
          className="absolute top-0 w-0.5 h-full bg-error z-20"
          style={{ left: nowOffset }}
        >
          <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-error" />
        </div>
      )}
    </div>
  );
}

export function useEPGTimeRange(hoursBack = 2, hoursForward = 4) {
  return useMemo(() => {
    const now = new Date();
    const startTime = new Date(now.getTime() - hoursBack * 60 * 60000);
    const endTime = new Date(now.getTime() + hoursForward * 60 * 60000);
    return { startTime, endTime };
  }, [hoursBack, hoursForward]);
}
