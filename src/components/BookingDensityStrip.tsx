import { getBookingPressureBySlot } from "../lib/boardStats";
import type { KitchenDisplayResponse, ServiceBoardRow } from "../types/kitchenDisplay";

type Props = {
  rows: ServiceBoardRow[];
  timeline: KitchenDisplayResponse["timeline"] & {
    startIso: string;
    endIso: string;
  };
};

function getDensityTone(bookings: number) {
  if (bookings === 0) {
    return "grey";
  }

  if (bookings <= 2) {
    return "green";
  }

  if (bookings <= 4) {
    return "yellow";
  }

  return "red";
}

const DENSITY_COLORS = {
  grey: "rgba(90, 93, 100, 0.35)",
  green: "rgba(53, 120, 74, 0.9)",
  yellow: "rgba(198, 137, 47, 0.92)",
  red: "rgba(178, 62, 54, 0.94)"
} as const;

type PressureRowProps = {
  label: string;
  suffix: "0-30" | "30-60";
  values: Array<{ slot: string; bookings: number }>;
};

function PressureRow({ label, suffix, values }: PressureRowProps) {
  return (
    <div
      aria-label={`${label} pressure strip`}
      style={{
        display: "grid",
        gridTemplateColumns: "56px minmax(0, 1fr)",
        gap: "8px",
        alignItems: "center"
      }}
    >
      <span
        style={{
          color: "var(--color-subtle)",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.06em"
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))`,
          gap: "4px"
        }}
      >
        {values.map((entry) => {
          const tone = getDensityTone(entry.bookings);

          return (
            <span
              key={`${suffix}-${entry.slot}`}
              data-testid={`booking-pressure-${suffix}-${entry.slot}`}
              data-density-tone={tone}
              title={`${label} ${entry.slot}: ${entry.bookings} bookings`}
              style={{
                height: "10px",
                borderRadius: "999px",
                background: DENSITY_COLORS[tone],
                boxShadow: tone === "grey" ? "inset 0 0 0 1px rgba(255,255,255,0.06)" : "none"
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function BookingDensityStrip({ rows, timeline }: Props) {
  const pressure = getBookingPressureBySlot(rows, timeline);

  return (
    <div
      aria-label="Booking pressure strips"
      style={{
        display: "grid",
        gap: "6px",
        marginBottom: "8px"
      }}
    >
      <PressureRow
        label="0-30m"
        suffix="0-30"
        values={pressure.map((entry) => ({
          slot: entry.slot,
          bookings: entry.starters
        }))}
      />
      <PressureRow
        label="30-60m"
        suffix="30-60"
        values={pressure.map((entry) => ({
          slot: entry.slot,
          bookings: entry.mains
        }))}
      />
    </div>
  );
}
