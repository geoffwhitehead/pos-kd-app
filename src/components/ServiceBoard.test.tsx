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
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /live order 12/i }));

    expect(onSelect).toHaveBeenCalledWith("12");
    expect(screen.getByLabelText(/ground floor/i)).toBeInTheDocument();
  });

  it("shrinks the visible board window and keeps empty rows compact", () => {
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
                endsAt: "2026-07-18T15:00:00Z",
              },
            ],
            liveOverlay: null,
          },
        ]}
        timeline={sampleKitchenDisplayResponse.timeline}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByText("19:00")).toBeInTheDocument();
    expect(screen.queryByText("12:00")).not.toBeInTheDocument();
    const emptyLabel = screen.getByText("99");
    expect(emptyLabel).toBeInTheDocument();
    expect(emptyLabel).toHaveStyle({ fontSize: "10px", lineHeight: "12px" });
    expect(emptyLabel.nextElementSibling).toHaveStyle({ minHeight: "12px" });
    expect(screen.queryByLabelText(/Past booking/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /live order 12/i }),
    ).toBeInTheDocument();
  });

  it("renders two booking pressure strips for 0-30 and 30-60 minute windows", () => {
    render(
      <ServiceBoard
        rows={sampleKitchenDisplayResponse.tables}
        timeline={sampleKitchenDisplayResponse.timeline}
        onSelect={() => {}}
      />,
    );

    expect(
      screen.getByLabelText(/booking pressure strips/i),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/starter pressure strip/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/main pressure strip/i)).toBeInTheDocument();
    expect(screen.getByTestId("booking-pressure-0-30-19:30")).toHaveAttribute(
      "data-density-tone",
      "green",
    );
    expect(screen.getByTestId("booking-pressure-30-60-19:30")).toHaveAttribute(
      "data-density-tone",
      "grey",
    );
    expect(screen.getByTestId("booking-pressure-0-30-20:00")).toHaveAttribute(
      "data-density-tone",
      "grey",
    );
  });

  it("renders a board-wide current time line", () => {
    render(
      <ServiceBoard
        rows={sampleKitchenDisplayResponse.tables}
        timeline={sampleKitchenDisplayResponse.timeline}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByTestId("service-board-now-line")).toBeInTheDocument();
    expect(screen.getByTestId("service-board-now-line")).toHaveStyle({
      transform: "translateX(-50%)",
    });
  });
});
