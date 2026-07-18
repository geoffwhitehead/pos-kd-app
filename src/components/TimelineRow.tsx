import { buildSegmentStyle, buildTimelineSlots, buildTimelineSlotsForWindow } from "../lib/timeline";
import type {
  KitchenDisplayResponse,
  LiveTableStatus,
  ServiceBoardRow
} from "../types/kitchenDisplay";

type Props = {
  row: ServiceBoardRow;
  timeline: KitchenDisplayResponse["timeline"] & {
    serviceDate?: string;
    startIso?: string;
    endIso?: string;
  };
  onSelect: (displayRef: string) => void;
};

const LIVE_STATUS_COLORS: Record<LiveTableStatus, string> = {
  active: "linear-gradient(90deg, rgba(53, 120, 74, 0.96), rgba(41, 94, 57, 0.96))",
  food_ordered:
    "linear-gradient(90deg, rgba(198, 137, 47, 0.96), rgba(170, 111, 37, 0.96))",
  called:
    "linear-gradient(90deg, rgba(198, 137, 47, 0.96), rgba(170, 111, 37, 0.96))"
};

function buildLiveSegments(row: ServiceBoardRow["liveOverlay"]) {
  if (row == null) {
    return [];
  }

  const segments: Array<{
    status: LiveTableStatus;
    start: string;
    end: string;
  }> = [];

  const foodOrderedAt = row.foodOrderedAt;
  const calledAt = row.calledAt;

  if (foodOrderedAt == null) {
    segments.push({
      status: row.status,
      start: row.openedAt,
      end: row.endsAt
    });

    return segments;
  }

  segments.push({
    status: "active",
    start: row.openedAt,
    end: foodOrderedAt
  });

  if (calledAt == null) {
    segments.push({
      status: "food_ordered",
      start: foodOrderedAt,
      end: row.endsAt
    });

    return segments;
  }

  segments.push({
    status: "food_ordered",
    start: foodOrderedAt,
    end: row.endsAt
  });

  return segments;
}

function buildRelativeSegmentStyle(
  startIso: string,
  endIso: string,
  overlayStartIso: string,
  overlayEndIso: string,
  bounds: {
    startHour: number;
    endHour: number;
    serviceDate: string;
    startIso?: string;
    endIso?: string;
  }
) {
  const overlayLeft = Number.parseFloat(
    buildSegmentStyle(overlayStartIso, overlayEndIso, bounds).left
  );
  const overlayWidth = Number.parseFloat(
    buildSegmentStyle(overlayStartIso, overlayEndIso, bounds).width
  );
  const segmentLeft = Number.parseFloat(buildSegmentStyle(startIso, endIso, bounds).left);
  const segmentWidth = Number.parseFloat(buildSegmentStyle(startIso, endIso, bounds).width);

  return {
    left: `${Math.max(0, ((segmentLeft - overlayLeft) / overlayWidth) * 100)}%`,
    width: `${Math.max(2, (segmentWidth / overlayWidth) * 100)}%`
  };
}

export function TimelineRow({ row, timeline, onSelect }: Props) {
  const serviceDate = timeline.serviceDate ?? timeline.now.slice(0, 10);
  const timelineSlots =
    timeline.startIso && timeline.endIso
      ? buildTimelineSlotsForWindow(timeline.startIso, timeline.endIso)
      : buildTimelineSlots(timeline.startHour, timeline.endHour);
  const intervalCount = Math.max(timelineSlots.length - 1, 1);
  const firstSlot = timelineSlots[0] ?? "00:00";
  const hourDividerOffset = firstSlot.endsWith(":30") ? 1 : 0;
  const hourDividerCount = Math.max(Math.ceil((intervalCount + hourDividerOffset) / 2), 1);
  const bounds = {
    startHour: timeline.startHour,
    endHour: timeline.endHour,
    serviceDate,
    startIso: timeline.startIso,
    endIso: timeline.endIso
  };
  const liveOverlay = row.liveOverlay;
  const liveSegments = buildLiveSegments(row.liveOverlay);
  const mainsCount =
    liveOverlay?.categorySummary.find((summary) => summary.label === "Mains")?.count ?? 0;
  const liveLabel = mainsCount > 0 ? String(mainsCount) : "";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "56px minmax(0, 1fr)",
        gap: "8px",
        alignItems: "center"
      }}
    >
      <strong style={{ fontSize: "14px" }}>{row.tableRef}</strong>
      <div
        style={{
          position: "relative",
          minHeight: "34px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.08) 0 1px, transparent 1px 100%), linear-gradient(to right, rgba(255,255,255,0.16) 0 1px, transparent 1px 100%)",
          backgroundSize: `${100 / intervalCount}% 100%, ${100 / hourDividerCount}% 100%`,
          backgroundPosition: `left top, ${hourDividerOffset === 0 ? "left" : `${50 / intervalCount}%`} top`
        }}
      >
        {row.bookings.map((booking) => (
          row.liveOverlay ? (
            <button
              key={booking.id}
              type="button"
              onClick={() => onSelect(row.displayRef)}
              style={{
                ...buildSegmentStyle(booking.startsAt, booking.endsAt, bounds),
                position: "absolute",
                top: "7px",
                height: "20px",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "6px",
                background: "rgba(90, 93, 100, 0.42)",
                color: "rgba(255,255,255,0.72)",
                padding: "0 8px",
                textAlign: "left"
              }}
              aria-label={`Booking ${booking.label} on table ${row.displayRef}`}
            >
              <span
                style={{
                  fontSize: "12px",
                  lineHeight: "20px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "block"
                }}
              >
                {booking.covers ?? ""}
              </span>
            </button>
          ) : (
            <div
              key={booking.id}
              style={{
                ...buildSegmentStyle(booking.startsAt, booking.endsAt, bounds),
                position: "absolute",
                top: "7px",
                height: "20px",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "6px",
                background: "rgba(90, 93, 100, 0.42)",
                color: "rgba(255,255,255,0.72)",
                padding: "0 8px",
                textAlign: "left"
              }}
              aria-label={`Booking ${booking.label} on table ${row.displayRef}`}
            >
              <span
                style={{
                  fontSize: "12px",
                  lineHeight: "20px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "block"
                }}
              >
                {booking.covers ?? ""}
              </span>
            </div>
          )
        ))}
        {liveOverlay ? (
          <button
            type="button"
            onClick={() => onSelect(row.displayRef)}
            style={{
              ...buildSegmentStyle(liveOverlay.startsAt, liveOverlay.endsAt, bounds),
              position: "absolute",
              top: "5px",
              height: "24px",
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: "7px",
              background: "rgba(18, 23, 20, 0.18)",
              color: "#f5f1e6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "0 8px",
              textAlign: "center",
              boxShadow: "0 6px 18px rgba(0,0,0,0.18)"
            }}
            aria-label={`Live order ${row.displayRef}`}
          >
            {liveSegments.map((segment, index) => (
              <span
                key={`${segment.status}-${segment.start}-${segment.end}`}
                data-testid={`live-segment-${segment.status}-${row.displayRef}`}
                style={{
                  ...buildRelativeSegmentStyle(
                    segment.start,
                    segment.end,
                    liveOverlay.startsAt,
                    liveOverlay.endsAt,
                    bounds
                  ),
                  position: "absolute",
                  insetBlock: 0,
                  background: LIVE_STATUS_COLORS[segment.status],
                  borderTopLeftRadius: index === 0 ? "7px" : 0,
                  borderBottomLeftRadius: index === 0 ? "7px" : 0,
                  borderTopRightRadius: index === liveSegments.length - 1 ? "7px" : 0,
                  borderBottomRightRadius: index === liveSegments.length - 1 ? "7px" : 0
                }}
              />
            ))}
            {liveOverlay.calledAt ? (
              <span
                data-testid={`live-call-marker-${row.displayRef}`}
                style={{
                  ...buildRelativeSegmentStyle(
                    liveOverlay.calledAt,
                    liveOverlay.calledAt,
                    liveOverlay.startsAt,
                    liveOverlay.endsAt,
                    bounds
                  ),
                  position: "absolute",
                  insetBlock: "-2px",
                  width: "2px",
                  background: "#d84a3f",
                  boxShadow: "0 0 0 1px rgba(216, 74, 63, 0.22), 0 0 8px rgba(216, 74, 63, 0.35)"
                }}
              />
            ) : null}
            <span
              style={{
                position: "relative",
                fontSize: "12px",
                fontWeight: 600,
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center"
              }}
            >
              {liveLabel}
            </span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
