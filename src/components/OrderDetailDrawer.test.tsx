import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";
import { OrderDetailDrawer } from "./OrderDetailDrawer";

describe("OrderDetailDrawer", () => {
  it("renders a receipt-style kitchen cheque with grouped uppercase items and call times", () => {
    render(
      <OrderDetailDrawer
        order={sampleKitchenDisplayResponse.activeOrders.inHouse[0]}
        onClose={() => {}}
      />
    );

    expect(
      screen.getByRole("heading", { name: "12" })
    ).toBeInTheDocument();
    expect(screen.getByText(/called/i)).toBeInTheDocument();
    expect(screen.getByText("19:38")).toBeInTheDocument();
    expect(screen.queryByText(/first fire/i)).not.toBeInTheDocument();
    expect(screen.getByText("STARTERS")).toBeInTheDocument();
    expect(screen.getByText("MAINS")).toBeInTheDocument();
    expect(screen.getByText("DESSERT")).toBeInTheDocument();
    expect(screen.getByText("1 X SPRING ROLLS")).toBeInTheDocument();
    expect(screen.getByText("2 X FISH AND CHIPS")).toBeInTheDocument();
    expect(screen.getByText("1 X STICKY TOFFEE PUDDING")).toBeInTheDocument();
  });
});
