import type { ServiceBoardRow as ServiceBoardRowType } from "../types/kitchenDisplay";
import type { KitchenDisplayResponse } from "../types/kitchenDisplay";
import { buildVisibleBoardTimeline, filterRowsForVisibleWindow } from "../lib/timeline";
import { BookingDensityStrip } from "./BookingDensityStrip";
import { TimelineAxis } from "./TimelineAxis";
import { TimelineRow } from "./TimelineRow";

type Props = {
  rows: ServiceBoardRowType[];
  timeline: KitchenDisplayResponse["timeline"];
  onSelect: (displayRef: string) => void;
};

export function ServiceBoard({ rows, timeline, onSelect }: Props) {
  const visibleTimeline = buildVisibleBoardTimeline(rows, timeline);
  const visibleRows = filterRowsForVisibleWindow(rows, visibleTimeline);
  const groupedRows = visibleRows.reduce<Record<string, ServiceBoardRowType[]>>((accumulator, row) => {
    accumulator[row.floor] ??= [];
    accumulator[row.floor].push(row);
    return accumulator;
  }, {});

  return (
    <section>
      <BookingDensityStrip rows={visibleRows} timeline={visibleTimeline} />
      <TimelineAxis
        startHour={visibleTimeline.startHour}
        endHour={visibleTimeline.endHour}
        startIso={visibleTimeline.startIso}
        endIso={visibleTimeline.endIso}
      />
      {Object.entries(groupedRows).map(([floor, floorRows]) => (
        <section key={floor} aria-label={floor} style={{ marginTop: "12px" }}>
          <div style={{ display: "grid", gap: "2px" }}>
            {floorRows.map((row) => (
              <TimelineRow
                key={row.displayRef}
                row={row}
                timeline={visibleTimeline}
                onSelect={onSelect}
              />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
