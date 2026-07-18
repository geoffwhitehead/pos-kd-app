import type { ServiceBoardRow as ServiceBoardRowType } from "../types/kitchenDisplay";
import type { KitchenDisplayResponse } from "../types/kitchenDisplay";
import { TimelineAxis } from "./TimelineAxis";
import { TimelineRow } from "./TimelineRow";

type Props = {
  rows: ServiceBoardRowType[];
  timeline: KitchenDisplayResponse["timeline"];
  onSelect: (displayRef: string) => void;
};

export function ServiceBoard({ rows, timeline, onSelect }: Props) {
  const groupedRows = rows.reduce<Record<string, ServiceBoardRowType[]>>((accumulator, row) => {
    accumulator[row.floor] ??= [];
    accumulator[row.floor].push(row);
    return accumulator;
  }, {});

  return (
    <section>
      <TimelineAxis startHour={timeline.startHour} endHour={timeline.endHour} />
      {Object.entries(groupedRows).map(([floor, floorRows]) => (
        <section key={floor} aria-label={floor} style={{ marginTop: "18px" }}>
          <h3 style={{ marginBottom: "10px" }}>{floor}</h3>
          <div style={{ display: "grid", gap: "6px" }}>
            {floorRows.map((row) => (
              <TimelineRow
                key={row.displayRef}
                row={row}
                timeline={timeline}
                onSelect={onSelect}
              />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
