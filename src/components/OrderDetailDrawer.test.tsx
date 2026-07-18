import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";
import { OrderDetailDrawer } from "./OrderDetailDrawer";

describe("OrderDetailDrawer", () => {
  it("shows status, category summary, and full items", () => {
    render(
      <OrderDetailDrawer
        order={sampleKitchenDisplayResponse.activeOrders.inHouse[0]}
        onClose={() => {}}
      />
    );

    expect(
      screen.getByRole("heading", { name: /order details/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/food ordered/i)).toBeInTheDocument();
    expect(screen.getByText(/2 starters/i)).toBeInTheDocument();
    expect(screen.getByText(/fish and chips/i)).toBeInTheDocument();
  });
});
