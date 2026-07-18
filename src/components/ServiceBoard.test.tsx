import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";
import { ServiceBoard } from "./ServiceBoard";

describe("ServiceBoard", () => {
  it("renders grouped timeline rows as tappable overlays", () => {
    const onSelect = vi.fn();

    render(
      <ServiceBoard
        rows={sampleKitchenDisplayResponse.tables}
        timeline={sampleKitchenDisplayResponse.timeline}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /live order 12/i }));

    expect(onSelect).toHaveBeenCalledWith("12");
    expect(screen.getByLabelText(/ground floor/i)).toBeInTheDocument();
  });

  it("shrinks the visible board window and filters out rows with nothing relevant in it", () => {
    render(
      <ServiceBoard
        rows={[
          ...sampleKitchenDisplayResponse.tables,
          {
            displayRef: "99",
            tableRef: "99",
            floor: "Ground Floor",
            bookings: [
              {
                id: "booking_99_1",
                label: "Past booking",
                covers: 2,
                startsAt: "2026-07-18T14:00:00Z",
                endsAt: "2026-07-18T15:00:00Z"
              }
            ],
            liveOverlay: null
          }
        ]}
        timeline={sampleKitchenDisplayResponse.timeline}
        onSelect={() => {}}
      />
    );

    expect(screen.getByText("19:00")).toBeInTheDocument();
    expect(screen.queryByText("12:00")).not.toBeInTheDocument();
    expect(screen.queryByText("99")).not.toBeInTheDocument();
  });

  it("renders two booking pressure strips for 0-30 and 30-60 minute windows", () => {
    render(
      <ServiceBoard
        rows={sampleKitchenDisplayResponse.tables}
        timeline={sampleKitchenDisplayResponse.timeline}
        onSelect={() => {}}
      />
    );

    expect(screen.getByLabelText(/booking pressure strips/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/0-30m pressure strip/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/30-60m pressure strip/i)).toBeInTheDocument();
    expect(screen.getByTestId("booking-pressure-0-30-19:30")).toHaveAttribute("data-density-tone", "green");
    expect(screen.getByTestId("booking-pressure-30-60-19:30")).toHaveAttribute("data-density-tone", "grey");
    expect(screen.getByTestId("booking-pressure-0-30-20:00")).toHaveAttribute("data-density-tone", "grey");
  });
});
