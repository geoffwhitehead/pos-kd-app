import { buildTimelineSlots } from "../lib/timeline";

type Props = {
  startHour: number;
  endHour: number;
};

export function TimelineAxis({ startHour, endHour }: Props) {
  const slots = buildTimelineSlots(startHour, endHour);

  return (
    <div aria-label="Timeline axis">
      {slots.map((slot) => (
        <span key={slot}>{slot}</span>
      ))}
    </div>
  );
}
