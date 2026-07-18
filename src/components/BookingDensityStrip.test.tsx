import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BookingDensityStrip } from "./BookingDensityStrip";

describe("BookingDensityStrip", () => {
  it("uses tighter thresholds suited to a busy small-room service", () => {
    render(
      <BookingDensityStrip
        rows={[
          {
            displayRef: "1",
            tableRef: "1",
            floor: "Ground Floor",
            bookings: [
              {
                id: "a",
                label: "A",
                covers: 2,
                startsAt: "2026-07-18T17:35:00Z",
                endsAt: "2026-07-18T19:00:00Z"
              },
              {
                id: "b",
                label: "B",
                covers: 2,
                startsAt: "2026-07-18T17:40:00Z",
                endsAt: "2026-07-18T19:00:00Z"
              },
              {
                id: "c",
                label: "C",
                covers: 2,
                startsAt: "2026-07-18T17:45:00Z",
                endsAt: "2026-07-18T19:00:00Z"
              },
              {
                id: "d",
                label: "D",
                covers: 2,
                startsAt: "2026-07-18T17:50:00Z",
                endsAt: "2026-07-18T19:00:00Z"
              },
              {
                id: "e",
                label: "E",
                covers: 2,
                startsAt: "2026-07-18T17:55:00Z",
                endsAt: "2026-07-18T19:00:00Z"
              }
            ],
            liveOverlay: null
          }
        ]}
        timeline={{
          startHour: 18,
          endHour: 19,
          now: "2026-07-18T18:30:00Z",
          startIso: "2026-07-18T18:00:00.000Z",
          endIso: "2026-07-18T19:00:00.000Z"
        }}
      />
    );

    expect(screen.getByTestId("booking-pressure-0-30-19:00")).toHaveAttribute(
      "data-density-tone",
      "red"
    );
    expect(screen.getByTestId("booking-pressure-0-30-19:00")).toHaveTextContent("10");
    expect(screen.getByTestId("booking-pressure-0-30-19:00")).toHaveAttribute(
      "title",
      "0-30m 19:00: 5 bookings, 10 covers"
    );
    expect(screen.getByTestId("booking-pressure-30-60-19:30")).toHaveAttribute(
      "data-density-tone",
      "red"
    );
    expect(screen.getByTestId("booking-pressure-30-60-19:30")).toHaveTextContent("10");
  });
});
