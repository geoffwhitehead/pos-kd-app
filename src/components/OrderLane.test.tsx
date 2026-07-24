import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";
import { OrderLane } from "./OrderLane";

describe("OrderLane", () => {
  it("renders cheque-style item lines and notifies when one is selected", () => {
    const onSelect = vi.fn();

    render(
      <OrderLane
        title="Eat-In"
        orders={sampleKitchenDisplayResponse.activeOrders.inHouse}
        currentTime="2026-07-18T19:42:10Z"
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /open order 12/i }));

    expect(onSelect).toHaveBeenCalledWith("12");
    expect(screen.getByText(/fish and chips/i)).toBeInTheDocument();
    const itemLine = screen.getByText(/fish and chips/i).closest("li");

    expect(itemLine).not.toBeNull();
    expect(within(itemLine!).getByText(/2/)).toBeInTheDocument();
    expect(screen.getByText(/no peas/i)).toBeInTheDocument();
    expect(screen.getByText(/fired/i)).toBeInTheDocument();
    expect(screen.getByText("19:10")).toBeInTheDocument();
    expect(screen.getByText(/called/i)).toBeInTheDocument();
    expect(screen.getByText("19:38")).toBeInTheDocument();
    expect(screen.queryByText(/^food ordered$/i)).not.toBeInTheDocument();
  });

  it("moves cheques older than one hour into an older rail", () => {
    render(
      <OrderLane
        title="Eat-In"
        currentTime="2026-07-18T19:42:10Z"
        orders={[
          {
            ...sampleKitchenDisplayResponse.activeOrders.inHouse[0]!,
            createdAt: "2026-07-18T19:10:00Z",
            updatedAt: "2026-07-18T19:32:00Z"
          },
          {
            ...sampleKitchenDisplayResponse.activeOrders.inHouse[0]!,
            displayRef: "7",
            billId: "bill_old_7",
            billRef: "7",
            createdAt: "2026-07-18T17:00:00Z",
            updatedAt: "2026-07-18T18:00:00Z"
          }
        ]}
        onSelect={() => {}}
      />
    );

    expect(screen.getByText(/current cheques/i)).toBeInTheDocument();
    expect(screen.getByText(/older than 1 hour/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open order 12/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open order 7/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open order 7/i })).toHaveAttribute(
      "data-card-size",
      "compact"
    );
    expect(screen.getByRole("button", { name: /open order 12/i })).toHaveAttribute(
      "data-card-size",
      "default"
    );
  });
});
