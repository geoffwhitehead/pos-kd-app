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
  layout?: {
    rowLabelWidth: number;
    rowGap: number;
    rowHeight: number;
    bookingTop: number;
    bookingHeight: number;
    liveTop: number;
    liveHeight: number;
    bookingFontSize: number;
    liveFontSize: number;
    rowLabelFontSize: number;
    livePaddingX: number;
    bookingPaddingX: number;
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

const DEFAULT_LAYOUT = {
  rowLabelWidth: 56,
  rowGap: 8,
  rowHeight: 34,
  bookingTop: 7,
  bookingHeight: 20,
  liveTop: 5,
  liveHeight: 24,
  bookingFontSize: 12,
  liveFontSize: 12,
  rowLabelFontSize: 14,
  livePaddingX: 8,
  bookingPaddingX: 8
} as const;

export function TimelineRow({ row, timeline, layout = DEFAULT_LAYOUT, onSelect }: Props) {
  const serviceDate = timeline.serviceDate ?? timeline.now.slice(0, 10);
  const timelineSlots =
    timeline.startIso && timeline.endIso
      ? buildTimelineSlotsForWindow(timeline.startIso, timeline.endIso)
      : buildTimelineSlots(timeline.startHour, timeline.endHour);
  const intervalCount = Math.max(timelineSlots.length - 1, 1);
  const lastIndex = Math.max(timelineSlots.length - 1, 1);
  const bounds = {
    startHour: timeline.startHour,
    endHour: timeline.endHour,
    serviceDate,
    startIso: timeline.startIso,
    endIso: timeline.endIso
  };
  const liveOverlay = row.liveOverlay;
  const liveSegments = buildLiveSegments(row.liveOverlay);
  const liveCallTimes = liveOverlay?.tableCalls ?? [];
  const mainsCount =
    liveOverlay?.categorySummary.find((summary) => summary.label === "Mains")?.count ?? 0;
  const liveLabel = mainsCount > 0 ? String(mainsCount) : "";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `${layout.rowLabelWidth}px minmax(0, 1fr)`,
        gap: `${layout.rowGap}px`,
        alignItems: "center"
      }}
    >
      <strong style={{ fontSize: `${layout.rowLabelFontSize}px` }}>{row.tableRef}</strong>
      <div
        style={{
          position: "relative",
          minHeight: `${layout.rowHeight}px`,
          borderBottom: "1px solid rgba(255,255,255,0.06)"
        }}
      >
        {timelineSlots.slice(1).map((slot, index) => {
          const slotIndex = index + 1;
          const isHourDivider = slot.endsWith(":00");

          return (
            <span
              key={`divider-${slot}-${slotIndex}`}
              aria-hidden="true"
              style={{
                position: "absolute",
                insetBlock: 0,
                left: `${(slotIndex / lastIndex) * 100}%`,
                width: "1px",
                background: isHourDivider
                  ? "rgba(255,255,255,0.16)"
                  : "rgba(255,255,255,0.08)",
                pointerEvents: "none"
              }}
            />
          );
        })}
        {row.bookings.map((booking) => (
          row.liveOverlay ? (
            <button
              key={booking.id}
              type="button"
              onClick={() => onSelect(row.displayRef)}
              style={{
                ...buildSegmentStyle(booking.startsAt, booking.endsAt, bounds),
                position: "absolute",
                top: `${layout.bookingTop}px`,
                height: `${layout.bookingHeight}px`,
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "6px",
                background: "rgba(90, 93, 100, 0.42)",
                color: "rgba(255,255,255,0.72)",
                padding: `0 ${layout.bookingPaddingX}px`,
                textAlign: "left"
              }}
              aria-label={`Booking ${booking.label} on table ${row.displayRef}`}
            >
              <span
                style={{
                  fontSize: `${layout.bookingFontSize}px`,
                  lineHeight: `${layout.bookingHeight}px`,
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
                top: `${layout.bookingTop}px`,
                height: `${layout.bookingHeight}px`,
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "6px",
                background: "rgba(90, 93, 100, 0.42)",
                color: "rgba(255,255,255,0.72)",
                padding: `0 ${layout.bookingPaddingX}px`,
                textAlign: "left"
              }}
              aria-label={`Booking ${booking.label} on table ${row.displayRef}`}
            >
              <span
                style={{
                  fontSize: `${layout.bookingFontSize}px`,
                  lineHeight: `${layout.bookingHeight}px`,
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
              top: `${layout.liveTop}px`,
              height: `${layout.liveHeight}px`,
              border: "1px solid rgba(255,255,255,0.16)",
              borderRadius: "7px",
              background: "rgba(18, 23, 20, 0.18)",
              color: "#f5f1e6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: `0 ${layout.livePaddingX}px`,
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
            {liveCallTimes.map((call) => (
              <span
                key={call.id}
                data-testid={`live-call-marker-${row.displayRef}-${call.id}`}
                style={{
                  ...buildRelativeSegmentStyle(
                    call.calledAt,
                    call.calledAt,
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
            ))}
            <span
              style={{
                position: "relative",
                fontSize: `${layout.liveFontSize}px`,
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
