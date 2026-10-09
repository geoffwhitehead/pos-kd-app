import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";
import { OrderCard } from "./OrderCard";
import { OrderDetailDrawer } from "./OrderDetailDrawer";

describe.each(["card", "details"])("offer context in %s", (view) => {
  it("renders the offer separately from the staff note", () => {
    const original = sampleKitchenDisplayResponse.activeOrders.inHouse[0];
    const order = {
      ...original,
      items: [
        {
          ...original.items[0],
          offerInstanceId: "offer-1",
          offerName: "Lunch special",
          printMessage: "Sauce on side",
        },
      ],
    };
    render(
      view === "card" ? (
        <OrderCard order={order} onPress={() => {}} />
      ) : (
        <OrderDetailDrawer order={order} onClose={() => {}} />
      ),
    );
    expect(screen.getByText("Offer: Lunch special")).toHaveAttribute(
      "data-offer-instance-id",
      "offer-1",
    );
    expect(screen.getByText("Note: Sauce on side")).toBeInTheDocument();
  });

  it("does not invent an offer label for ordinary items", () => {
    const order = sampleKitchenDisplayResponse.activeOrders.inHouse[0];
    render(
      view === "card" ? (
        <OrderCard order={order} onPress={() => {}} />
      ) : (
        <OrderDetailDrawer order={order} onClose={() => {}} />
      ),
    );
    expect(screen.queryByText(/^Offer:/)).not.toBeInTheDocument();
  });
});
