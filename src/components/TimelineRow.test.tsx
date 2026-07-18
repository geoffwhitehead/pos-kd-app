import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";
import { TimelineRow } from "./TimelineRow";

describe("TimelineRow", () => {
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
      </>
    );

    expect(
      within(screen.getByRole("button", { name: /booking walker on table 12/i })).getByText("4")
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("button", { name: /live order 12/i })).getByText("3")
    ).toBeInTheDocument();
    expect(screen.queryByText(/walker/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/food ordered/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /live order 15/i }).textContent?.trim()).toBe("");
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
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: /booking walker on table 12/i }));
    expect(onSelect).toHaveBeenCalledWith("12");
    expect(screen.queryByRole("button", { name: /booking lesley on table 16/i })).not.toBeInTheDocument();
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
                calledAt: "2026-07-18T18:35:00Z"
              },
              {
                id: "call_2",
                displayRef: "12",
                calledAt: "2026-07-18T18:38:00Z"
              }
            ]
          }
        }}
        timeline={sampleKitchenDisplayResponse.timeline}
        onSelect={() => {}}
      />
    );

    expect(screen.getByTestId("live-segment-active-12")).toBeInTheDocument();
    expect(screen.getByTestId("live-segment-food_ordered-12")).toBeInTheDocument();
    expect(screen.queryByTestId("live-segment-called-12")).not.toBeInTheDocument();
    expect(screen.getByTestId("live-call-marker-12-call_1")).toBeInTheDocument();
    expect(screen.getByTestId("live-call-marker-12-call_2")).toBeInTheDocument();
    expect(screen.queryByLabelText(/called bell/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^called$/i)).not.toBeInTheDocument();
    expect(
      Number.parseFloat(screen.getByTestId("live-segment-food_ordered-12").style.width)
    ).toBeGreaterThan(50);
  });
});
