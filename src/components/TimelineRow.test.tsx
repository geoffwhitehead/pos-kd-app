import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";
import { TimelineRow } from "./TimelineRow";

describe("TimelineRow", () => {
  it("extends active orders to now with square right edges but preserves closed ends", () => {
    const row = structuredClone(sampleKitchenDisplayResponse.tables[0]!);
    row.liveOverlay!.endsAt = "2026-07-18T18:30:00Z";
    const timeline = {
      ...sampleKitchenDisplayResponse.timeline,
      now: "2026-07-18T19:00:00Z",
    };
    const props = { row, timeline, onSelect: () => {} };
    const { rerender } = render(<TimelineRow {...props} />);
    const bar = screen.getByRole("button", { name: /live order 12/i });
    expect(
      Number.parseFloat(bar.style.left) + Number.parseFloat(bar.style.width),
    ).toBeCloseTo(80);
    expect(bar).toHaveStyle({ borderRadius: "7px 0 0 7px" });
    row.liveOverlay!.isRetained = true;
    rerender(<TimelineRow {...props} />);
    expect(
      Number.parseFloat(bar.style.left) + Number.parseFloat(bar.style.width),
    ).toBeCloseTo(75);
    expect(bar).toHaveStyle({ borderRadius: "7px" });
  });
  it("only flags unbooked active tables when booking data is available", () => {
    const props = {
      row: sampleKitchenDisplayResponse.tables[1]!,
      timeline: sampleKitchenDisplayResponse.timeline,
      onSelect: () => {},
    };
    const { rerender } = render(<TimelineRow {...props} />);
    expect(
      screen.getByRole("button", { name: /live order 15/i }),
    ).toHaveAttribute("data-walk-in", "true");
    rerender(<TimelineRow {...props} bookingsAvailable={false} />);
    expect(
      screen.getByRole("button", { name: /live order 15/i }),
    ).toHaveAttribute("data-walk-in", "false");
  });

  it("highlights reservations created within four hours, not their arrival time", () => {
    const row = structuredClone(sampleKitchenDisplayResponse.tables[2]!);
    row.bookings[0].createdAt = "2026-07-18T16:00:00Z";
    const props = {
      row,
      timeline: sampleKitchenDisplayResponse.timeline,
      onSelect: () => {},
    };
    const { rerender } = render(<TimelineRow {...props} />);
    expect(screen.getByLabelText(/booking lesley/i)).toHaveAttribute(
      "data-new-booking",
      "true",
    );
    expect(screen.getByLabelText("New reservation")).toHaveTextContent("N");
    row.bookings[0].createdAt = "2026-07-18T10:00:00Z";
    rerender(<TimelineRow {...props} />);
    expect(screen.getByLabelText(/booking lesley/i)).toHaveAttribute(
      "data-new-booking",
      "false",
    );
    row.bookings[0].createdAt = undefined;
    rerender(<TimelineRow {...props} />);
    expect(screen.queryByLabelText("New reservation")).not.toBeInTheDocument();
  });

  it("renders booking bars and a compact live till overlay without item summaries", () => {
    render(
      <>
        <TimelineRow
          row={sampleKitchenDisplayResponse.tables[0]!}
          timeline={sampleKitchenDisplayResponse.timeline}
          onSelect={() => {}}
        />
        <TimelineRow
          row={sampleKitchenDisplayResponse.tables[1]!}
          timeline={sampleKitchenDisplayResponse.timeline}
          onSelect={() => {}}
        />
      </>,
    );

    expect(
      within(
        screen.getByRole("button", { name: /booking walker on table 12/i }),
      ).getByText("4"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("button", { name: /live order 12/i })).getByText(
        "3",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/walker/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/food ordered/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /live order 15/i }),
    ).toHaveAttribute("data-walk-in", "true");
    expect(screen.queryByText(/2 starters/i)).not.toBeInTheDocument();
  });

  it("only makes bookings selectable when the row has an active order", () => {
    const onSelect = vi.fn();

    render(
      <>
        <TimelineRow
          row={sampleKitchenDisplayResponse.tables[0]!}
          timeline={sampleKitchenDisplayResponse.timeline}
          onSelect={onSelect}
        />
        <TimelineRow
          row={sampleKitchenDisplayResponse.tables[2]!}
          timeline={sampleKitchenDisplayResponse.timeline}
          onSelect={onSelect}
        />
      </>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /booking walker on table 12/i }),
    );
    expect(onSelect).toHaveBeenCalledWith("12");
    expect(
      screen.queryByRole("button", { name: /booking lesley on table 16/i }),
    ).not.toBeInTheDocument();
  });

  it("renders a segmented live bar when food and call times are available", () => {
    render(
      <TimelineRow
        row={{
          ...sampleKitchenDisplayResponse.tables[0]!,
          liveOverlay: {
            ...sampleKitchenDisplayResponse.tables[0]!.liveOverlay!,
            status: "called",
            openedAt: "2026-07-18T18:10:00Z",
            foodOrderedAt: "2026-07-18T18:20:00Z",
            calledAt: "2026-07-18T18:35:00Z",
            endsAt: "2026-07-18T18:42:10Z",
            tableCalls: [
              {
                id: "call_1",
                displayRef: "12",
                calledAt: "2026-07-18T18:35:00Z",
              },
              {
                id: "call_2",
                displayRef: "12",
                calledAt: "2026-07-18T18:38:00Z",
              },
            ],
          },
        }}
        timeline={sampleKitchenDisplayResponse.timeline}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByTestId("live-segment-active-12")).toBeInTheDocument();
    expect(
      screen.getByTestId("live-segment-food_ordered-12"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("live-segment-called-12"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("live-call-marker-12-call_1"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("live-call-marker-12-call_2"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/called bell/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^called$/i)).not.toBeInTheDocument();
    expect(
      Number.parseFloat(
        screen.getByTestId("live-segment-food_ordered-12").style.width,
      ),
    ).toBeGreaterThan(50);
  });
});
