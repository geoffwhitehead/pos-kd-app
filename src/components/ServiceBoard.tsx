import { useEffect, useState } from "react";
import type { ServiceBoardRow as ServiceBoardRowType } from "../types/kitchenDisplay";
import type { KitchenDisplayResponse } from "../types/kitchenDisplay";
import { buildVisibleBoardTimeline, filterRowsForVisibleWindow } from "../lib/timeline";
import { buildSegmentStyle } from "../lib/timeline";
import { BookingDensityStrip } from "./BookingDensityStrip";
import { TimelineAxis } from "./TimelineAxis";
import { TimelineRow } from "./TimelineRow";

type Props = {
  rows: ServiceBoardRowType[];
  timeline: KitchenDisplayResponse["timeline"];
  onSelect: (displayRef: string) => void;
};

const RESERVED_VIEWPORT_HEIGHT = 360;
const MIN_ROW_HEIGHT = 22;
const MAX_ROW_HEIGHT = 34;
const MIN_BOOKING_HEIGHT = 14;
const MAX_BOOKING_HEIGHT = 20;
const MIN_LIVE_HEIGHT = 18;
const MAX_LIVE_HEIGHT = 24;
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 12;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function ServiceBoard({ rows, timeline, onSelect }: Props) {
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window === "undefined" ? 1080 : window.innerHeight
  );

  useEffect(() => {
    function updateViewportHeight() {
      setViewportHeight(window.innerHeight);
    }

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);

    return () => {
      window.removeEventListener("resize", updateViewportHeight);
    };
  }, []);

  const visibleTimeline = buildVisibleBoardTimeline(rows, timeline);
  const visibleRows = filterRowsForVisibleWindow(rows, visibleTimeline);
  const rowCount = Math.max(visibleRows.length, 1);
  const serviceDate = visibleTimeline.serviceDate ?? visibleTimeline.now.slice(0, 10);
  const bounds = {
    startHour: visibleTimeline.startHour,
    endHour: visibleTimeline.endHour,
    serviceDate,
    startIso: visibleTimeline.startIso,
    endIso: visibleTimeline.endIso
  };
  const nowLineStyle = buildSegmentStyle(visibleTimeline.now, visibleTimeline.now, bounds);
  const groupedRows = visibleRows.reduce<Record<string, ServiceBoardRowType[]>>((accumulator, row) => {
    accumulator[row.floor] ??= [];
    accumulator[row.floor].push(row);
    return accumulator;
  }, {});
  const availableGridHeight = Math.max(320, viewportHeight - RESERVED_VIEWPORT_HEIGHT);
  const rowHeight = clamp(Math.floor(availableGridHeight / rowCount) - 2, MIN_ROW_HEIGHT, MAX_ROW_HEIGHT);
  const densityScale = clamp(rowHeight / MAX_ROW_HEIGHT, 0.64, 1);
  const layout = {
    rowLabelWidth: 56,
    rowGap: 8,
    rowHeight,
    bookingTop: Math.max(3, Math.round(rowHeight * 0.18)),
    bookingHeight: clamp(Math.round(MAX_BOOKING_HEIGHT * densityScale), MIN_BOOKING_HEIGHT, MAX_BOOKING_HEIGHT),
    liveTop: Math.max(2, Math.round(rowHeight * 0.12)),
    liveHeight: clamp(Math.round(MAX_LIVE_HEIGHT * densityScale), MIN_LIVE_HEIGHT, MAX_LIVE_HEIGHT),
    bookingFontSize: clamp(Math.round(MAX_FONT_SIZE * densityScale), MIN_FONT_SIZE, MAX_FONT_SIZE),
    liveFontSize: clamp(Math.round(MAX_FONT_SIZE * densityScale), MIN_FONT_SIZE, MAX_FONT_SIZE),
    rowLabelFontSize: clamp(Math.round(14 * densityScale), 11, 14),
    livePaddingX: clamp(Math.round(8 * densityScale), 5, 8),
    bookingPaddingX: clamp(Math.round(8 * densityScale), 5, 8)
  };

  return (
    <section>
      <BookingDensityStrip rows={visibleRows} timeline={visibleTimeline} />
      <TimelineAxis
        startHour={visibleTimeline.startHour}
        endHour={visibleTimeline.endHour}
        startIso={visibleTimeline.startIso}
        endIso={visibleTimeline.endIso}
      />
      <div style={{ position: "relative" }}>
        <span
          data-testid="service-board-now-line"
          aria-label="Current time line"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `calc(56px + 8px + ${nowLineStyle.left})`,
            width: "3px",
            background: "linear-gradient(180deg, rgba(234, 70, 58, 0.98), rgba(181, 58, 50, 0.98))",
            boxShadow: "0 0 0 1px rgba(181, 58, 50, 0.26), 0 0 16px rgba(216, 74, 63, 0.32)",
            borderRadius: "999px",
            pointerEvents: "none",
            zIndex: 5
          }}
        />
        {Object.entries(groupedRows).map(([floor, floorRows]) => (
          <section key={floor} aria-label={floor} style={{ marginTop: "12px" }}>
            <div style={{ display: "grid", gap: "2px" }}>
              {floorRows.map((row) => (
              <TimelineRow
                key={row.displayRef}
                row={row}
                timeline={visibleTimeline}
                layout={layout}
                onSelect={onSelect}
              />
            ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
