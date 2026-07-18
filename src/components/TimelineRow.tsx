import { formatStatusLabel } from "../lib/format";
import { buildSegmentStyle } from "../lib/timeline";
import type {
  KitchenDisplayResponse,
  LiveTableStatus,
  ServiceBoardRow
} from "../types/kitchenDisplay";

type Props = {
  row: ServiceBoardRow;
  timeline: KitchenDisplayResponse["timeline"];
  onSelect: (displayRef: string) => void;
};

const LIVE_STATUS_COLORS: Record<LiveTableStatus, string> = {
  active: "linear-gradient(90deg, rgba(84, 103, 122, 0.95), rgba(70, 88, 107, 0.95))",
  food_ordered:
    "linear-gradient(90deg, rgba(198, 137, 47, 0.96), rgba(170, 111, 37, 0.96))",
  called:
    "linear-gradient(90deg, rgba(49, 132, 112, 0.96), rgba(38, 104, 88, 0.96))"
};

export function TimelineRow({ row, timeline, onSelect }: Props) {
  const serviceDate = timeline.now.slice(0, 10);
  const bounds = {
    startHour: timeline.startHour,
    endHour: timeline.endHour,
    serviceDate
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "72px minmax(0, 1fr)",
        gap: "12px",
        alignItems: "center"
      }}
    >
      <strong>{row.tableRef}</strong>
      <div
        style={{
          position: "relative",
          minHeight: "52px",
          borderBottom: "1px solid rgba(255,255,255,0.06)"
        }}
      >
        {row.bookings.map((booking) => (
          <button
            key={booking.id}
            type="button"
            onClick={() => onSelect(row.displayRef)}
            style={{
              ...buildSegmentStyle(booking.startsAt, booking.endsAt, bounds),
              position: "absolute",
              top: "8px",
              height: "34px",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "10px",
              background: "rgba(90, 93, 100, 0.42)",
              color: "rgba(255,255,255,0.72)",
              padding: "0 12px",
              textAlign: "left"
            }}
            aria-label={`Booking ${booking.label} on table ${row.displayRef}`}
          >
            {booking.label}
          </button>
        ))}
        {row.liveOverlay ? (
          <button
            type="button"
            onClick={() => onSelect(row.displayRef)}
            style={{
              ...buildSegmentStyle(row.liveOverlay.startsAt, row.liveOverlay.endsAt, bounds),
              position: "absolute",
              top: "14px",
              height: "34px",
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: "10px",
              background: LIVE_STATUS_COLORS[row.liveOverlay.status],
              color: "#f5f1e6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              padding: "0 12px",
              textAlign: "left",
              boxShadow: "0 10px 24px rgba(0,0,0,0.18)"
            }}
            aria-label={`Live order ${row.displayRef}`}
          >
            <span>{formatStatusLabel(row.liveOverlay.status)}</span>
            {row.liveOverlay.categorySummary.length > 0 ? (
              <span style={{ fontSize: "12px", opacity: 0.88 }}>
                {row.liveOverlay.categorySummary
                  .map((summary) => `${summary.count} ${summary.label.toLowerCase()}`)
                  .join(", ")}
              </span>
            ) : null}
          </button>
        ) : null}
      </div>
    </div>
  );
}
