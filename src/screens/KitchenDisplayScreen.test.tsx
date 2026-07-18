import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";
import { KitchenDisplayScreen } from "./KitchenDisplayScreen";

describe("KitchenDisplayScreen", () => {
  it("renders the stats strip and split board layout", () => {
    render(
      <KitchenDisplayScreen
        data={sampleKitchenDisplayResponse}
        isLoading={false}
        error={null}
      />
    );

    expect(screen.queryByRole("heading", { name: /kitchen operations display/i })).not.toBeInTheDocument();
    const statsBar = screen.getByLabelText(/service stats/i);

    expect(within(statsBar).getByText(/total bookings/i)).toBeInTheDocument();
    expect(within(statsBar).getByText(/total covers/i)).toBeInTheDocument();
    expect(within(statsBar).getByText(/active tables/i)).toBeInTheDocument();
    expect(within(statsBar).getByText(/kitchen cheques/i)).toBeInTheDocument();
    expect(within(statsBar).getByText(/due in next 30/i)).toBeInTheDocument();
    expect(within(statsBar).getByText(/takeaway live/i)).toBeInTheDocument();
    expect(within(statsBar).getByText("8")).toBeInTheDocument();
    expect(within(statsBar).getAllByText("2")).toHaveLength(2);
    expect(within(statsBar).getAllByText("1")).toHaveLength(2);
    expect(within(statsBar).getByText("0")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /service board/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /active orders/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/timeline axis/i)).toBeInTheDocument();
    const inHouseLane = screen.getByLabelText("In House");
    const billCalls = screen.getByLabelText(/bill calls/i);

    expect(within(inHouseLane).getByText(/fish and chips/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/booking pressure strips/i)).toBeInTheDocument();
    expect(billCalls).toBeInTheDocument();
    expect(within(billCalls).getByText("Table 12")).toBeInTheDocument();
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

    expect(within(details).getByRole("heading", { name: "12" })).toBeInTheDocument();
    expect(within(details).getByText("2 X FISH AND CHIPS")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /active orders/i })).not.toBeInTheDocument();
  });

  it("dismisses a bill call from the footer locally", () => {
    render(
      <KitchenDisplayScreen
        data={sampleKitchenDisplayResponse}
        isLoading={false}
        error={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /dismiss call call_12_1/i }));

    const billCalls = screen.getByLabelText(/bill calls/i);

    expect(billCalls).toBeInTheDocument();
    expect(within(billCalls).queryByText("Table 12")).not.toBeInTheDocument();
    expect(within(billCalls).getByText(/no bill calls/i)).toBeInTheDocument();
  });

  it("opens the full cheque when a booking with an active order is clicked", () => {
    render(
      <KitchenDisplayScreen
        data={sampleKitchenDisplayResponse}
        isLoading={false}
        error={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /booking walker on table 12/i }));

    const details = screen.getByLabelText(/order details/i);

    expect(within(details).getByRole("heading", { name: "12" })).toBeInTheDocument();
    expect(within(details).getByText("2 X FISH AND CHIPS")).toBeInTheDocument();
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
