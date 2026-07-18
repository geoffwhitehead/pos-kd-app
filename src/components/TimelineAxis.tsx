import { buildTimelineSlots, buildTimelineSlotsForWindow } from "../lib/timeline";

type Props = {
  startHour: number;
  endHour: number;
  startIso?: string;
  endIso?: string;
};

export function TimelineAxis({ startHour, endHour, startIso, endIso }: Props) {
  const slots =
    startIso && endIso
      ? buildTimelineSlotsForWindow(startIso, endIso)
      : buildTimelineSlots(startHour, endHour);
  const lastIndex = Math.max(slots.length - 1, 1);

  return (
    <div
      aria-label="Timeline axis"
      style={{
        display: "grid",
        gridTemplateColumns: "56px minmax(0, 1fr)",
        gap: "8px",
        alignItems: "end",
        marginBottom: "10px"
      }}
    >
      <span style={{ color: "var(--color-subtle)", fontSize: "12px" }}>Table</span>
      <div
        style={{
          minHeight: "24px",
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: "6px",
          position: "relative"
        }}
      >
        {slots.map((slot, index) => (
          <span
            key={slot}
            style={{
              position: "absolute",
              left: `${(index / lastIndex) * 100}%`,
              fontSize: index % 2 === 0 ? "12px" : "10px",
              color:
                index % 2 === 0 ? "var(--color-text)" : "rgba(242, 241, 232, 0.54)",
              fontVariantNumeric: "tabular-nums",
              transform:
                index === 0
                  ? index % 2 === 0
                    ? "translateX(-50%)"
                    : "translate(-50%, 2px)"
                  : index === lastIndex
                    ? index % 2 === 0
                      ? "translateX(-100%)"
                      : "translate(-100%, 2px)"
                    : index % 2 === 0
                      ? "translateX(-50%)"
                      : "translate(-50%, 2px)",
              whiteSpace: "nowrap",
              lineHeight: 1,
              textAlign: "center"
            }}
          >
            {slot}
          </span>
        ))}
      </div>
    </div>
  );
}
