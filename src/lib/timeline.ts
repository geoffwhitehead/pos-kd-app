type TimelineBounds = {
  startHour: number;
  endHour: number;
  serviceDate: string;
};

export function buildTimelineSlots(startHour: number, endHour: number) {
  return Array.from({ length: endHour - startHour + 1 }, (_, index) => {
    const hour = String(startHour + index).padStart(2, "0");

    return `${hour}:00`;
  });
}

export function toTimelinePercent(isoValue: string, bounds: TimelineBounds) {
  const start = new Date(
    `${bounds.serviceDate}T${String(bounds.startHour).padStart(2, "0")}:00:00Z`
  );
  const end = new Date(
    `${bounds.serviceDate}T${String(bounds.endHour).padStart(2, "0")}:00:00Z`
  );
  const value = new Date(isoValue);
  const ratio =
    (value.getTime() - start.getTime()) / (end.getTime() - start.getTime());

  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

export function buildSegmentStyle(
  startIso: string,
  endIso: string,
  bounds: TimelineBounds
) {
  const left = toTimelinePercent(startIso, bounds);
  const right = toTimelinePercent(endIso, bounds);

  return {
    left: `${left}%`,
    width: `${Math.max(right - left, 2)}%`
  };
}
