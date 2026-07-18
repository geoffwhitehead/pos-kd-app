import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";
import { KitchenDisplayScreen } from "./KitchenDisplayScreen";

describe("KitchenDisplayScreen", () => {
  it("renders the split service board and active orders headings", () => {
    render(
      <KitchenDisplayScreen
        data={sampleKitchenDisplayResponse}
        isLoading={false}
        error={null}
      />
    );

    expect(
      screen.getByRole("heading", { name: /service board/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /active orders/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/timeline axis/i)).toBeInTheDocument();
    const inHouseLane = screen.getByLabelText(/in house/i);

    expect(within(inHouseLane).getByText(/2 starters/i)).toBeInTheDocument();
  });

  it("opens a read-only detail drawer when an order is tapped", () => {
    render(
      <KitchenDisplayScreen
        data={sampleKitchenDisplayResponse}
        isLoading={false}
        error={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /open order 12/i }));

    const details = screen.getByLabelText(/order details/i);

    expect(
      within(details).getByRole("heading", { name: /order details/i })
    ).toBeInTheDocument();
    expect(within(details).getByText(/fish and chips/i)).toBeInTheDocument();
  });

  it("shows a visible warning when live orders are unavailable", () => {
    render(
      <KitchenDisplayScreen
        data={{
          ...sampleKitchenDisplayResponse,
          liveOrdersStatus: "unavailable",
          warnings: [
            {
              code: "LIVE_ORDERS_UNAVAILABLE",
              message: "Live till order data is unavailable."
            }
          ]
        }}
        isLoading={false}
        error={null}
      />
    );

    expect(
      screen.getByText(/live till order data is unavailable/i)
    ).toBeInTheDocument();
  });
});
