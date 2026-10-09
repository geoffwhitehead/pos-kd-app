import { getBookingPressureBySlot } from "../lib/boardStats";
import type {
  KitchenDisplayResponse,
  ServiceBoardRow,
} from "../types/kitchenDisplay";

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
  grey: "var(--color-booking)",
  green: "#246638",
  yellow: "#875609",
  red: "#a5241e",
} as const;

type PressureRowProps = {
  label: string;
  suffix: "0-30" | "30-60" | "60-90";
  values: Array<{ slot: string; bookings: number; covers: number }>;
};

function PressureRow({ label, suffix, values }: PressureRowProps) {
  const isDessert = suffix === "60-90";
  const assumption = isDessert
    ? " Weighted to 2/5 (40%) of tables and covers."
    : "";
  return (
    <div
      aria-label={`${label} strip`}
      style={{
        display: "grid",
        gridTemplateColumns: "56px minmax(0, 1fr)",
        gap: "8px",
        alignItems: "center",
      }}
    >
      <span
        title={`Estimated ${label.toLowerCase()} from arrivals ${suffix} minutes earlier. Numbers show covers; colours show arriving tables.${assumption}`}
        style={{
          color: "var(--color-subtle)",
          fontSize: "9px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))`,
          gap: "4px",
        }}
      >
        {values.map((entry) => {
          const tone = getDensityTone(entry.bookings);

          return (
            <span
              key={`${suffix}-${entry.slot}`}
              data-testid={`booking-pressure-${suffix}-${entry.slot}`}
              data-density-tone={tone}
              title={`${label} ${entry.slot}: ${isDessert ? entry.bookings.toFixed(1) : entry.bookings} bookings, ${isDessert ? entry.covers.toFixed(1) : entry.covers} covers arriving ${suffix} minutes earlier (estimate)${assumption}`}
              style={{
                height: "16px",
                borderRadius: "999px",
                background: DENSITY_COLORS[tone],
                boxShadow:
                  tone === "grey"
                    ? "inset 0 0 0 1px rgba(255,255,255,0.06)"
                    : "none",
                color: tone === "grey" ? "var(--color-text)" : "#ffffff",
                fontSize: "9px",
                fontWeight: 700,
                lineHeight: "16px",
                textAlign: "center",
                letterSpacing: "0.02em",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              {entry.covers > 0
                ? isDessert
                  ? entry.covers < 1
                    ? "<1"
                    : `≈${Math.round(entry.covers)}`
                  : entry.covers
                : ""}
            </span>
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
        marginBottom: "8px",
      }}
    >
      <PressureRow
        label="Starter pressure"
        suffix="0-30"
        values={pressure.map((entry) => ({
          slot: entry.slot,
          bookings: entry.starters,
          covers: entry.starterCovers,
        }))}
      />
      <PressureRow
        label="Main pressure"
        suffix="30-60"
        values={pressure.map((entry) => ({
          slot: entry.slot,
          bookings: entry.mains,
          covers: entry.mainCovers,
        }))}
      />
      <PressureRow
        label="Dessert pressure"
        suffix="60-90"
        values={pressure.map((entry) => ({
          slot: entry.slot,
          bookings: entry.desserts,
          covers: entry.dessertCovers,
        }))}
      />
    </div>
  );
}
