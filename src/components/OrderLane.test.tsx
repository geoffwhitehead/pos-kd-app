import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";
import { OrderLane } from "./OrderLane";

describe("OrderLane", () => {
  it("renders category summaries and notifies when one is selected", () => {
    const onSelect = vi.fn();

    render(
      <OrderLane
        title="In House"
        orders={sampleKitchenDisplayResponse.activeOrders.inHouse}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /open order 12/i }));

    expect(onSelect).toHaveBeenCalledWith("12");
    expect(screen.getByText(/2 starters/i)).toBeInTheDocument();
    expect(screen.getByText(/3 mains/i)).toBeInTheDocument();
  });
});
