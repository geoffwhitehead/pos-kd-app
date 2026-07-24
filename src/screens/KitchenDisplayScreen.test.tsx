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
    expect(within(statsBar).getByText(/ordering soon/i)).toBeInTheDocument();
    expect(within(statsBar).getByText(/due in next 30/i)).toBeInTheDocument();
    expect(within(statsBar).getByText(/due in 60 min/i)).toBeInTheDocument();
    expect(within(statsBar).getByText(/takeaway live/i)).toBeInTheDocument();
    expect(within(statsBar).getByText(/card tips/i)).toBeInTheDocument();
    expect(within(statsBar).getByText(/time/i)).toBeInTheDocument();
    expect(within(statsBar).getByText("8")).toBeInTheDocument();
    expect(within(statsBar).getByText("2")).toBeInTheDocument();
    expect(within(statsBar).getByText("£184.20")).toBeInTheDocument();
    expect(within(statsBar).getByText(/closed bills today/i)).toBeInTheDocument();
    expect(within(statsBar).getByText("19:42")).toBeInTheDocument();
    expect(within(statsBar).getAllByText("0 covers")).toHaveLength(3);
    expect(within(statsBar).getByText("1 remaining")).toBeInTheDocument();
    expect(within(statsBar).getByText("4 remaining")).toBeInTheDocument();
    expect(within(statsBar).getAllByText("0")).toHaveLength(2);
    expect(screen.queryByRole("heading", { name: /service board/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /active orders/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/timeline axis/i)).toBeInTheDocument();
    const inHouseLane = screen.getByLabelText("Eat-In");
    const billCalls = screen.getByLabelText(/bill calls/i);
    const reviews = screen.getByLabelText(/reviews/i);

    expect(within(inHouseLane).getByText(/fish and chips/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/booking pressure strips/i)).toBeInTheDocument();
    expect(billCalls).toBeInTheDocument();
    expect(within(billCalls).getByText("Table 12")).toBeInTheDocument();
    expect(reviews).toBeInTheDocument();
    expect(within(reviews).getByText(/cein mcgillicuddy/i)).toBeInTheDocument();
    expect(screen.getByTestId("footer-rail")).toHaveStyle({ display: "flex" });
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

    fireEvent.click(screen.getByRole("button", { name: /dismiss call bill_abc123:call_12_1/i }));

    const billCalls = screen.getByLabelText(/bill calls/i);

    expect(billCalls).toBeInTheDocument();
    expect(within(billCalls).queryByText("Table 12")).not.toBeInTheDocument();
    expect(within(billCalls).getByText(/no bill calls/i)).toBeInTheDocument();
  });

  it("shows a new bill call for the same table after the previous dismissed instance disappears", () => {
    const { rerender } = render(
      <KitchenDisplayScreen
        data={sampleKitchenDisplayResponse}
        isLoading={false}
        error={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /dismiss call bill_abc123:call_12_1/i }));

    rerender(
      <KitchenDisplayScreen
        data={{
          ...sampleKitchenDisplayResponse,
          activeOrders: {
            ...sampleKitchenDisplayResponse.activeOrders,
            inHouse: sampleKitchenDisplayResponse.activeOrders.inHouse.map((order) =>
              order.billId === "bill_abc123"
                ? {
                    ...order,
                    billId: "bill_12_second",
                    tableCalls: [
                      {
                        id: "call_12_1",
                        displayRef: "12",
                        calledAt: "2026-07-18T20:05:00Z"
                      }
                    ]
                  }
                : order
            )
          }
        }}
        isLoading={false}
        error={null}
      />
    );

    const billCalls = screen.getByLabelText(/bill calls/i);

    expect(within(billCalls).getByText("Table 12")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /dismiss call bill_12_second:call_12_1/i })
    ).toBeInTheDocument();
  });

  it("keeps same-day live table cells on the planner after live active orders disappear", () => {
    const { rerender } = render(
      <KitchenDisplayScreen
        data={sampleKitchenDisplayResponse}
        isLoading={false}
        error={null}
      />
    );

    rerender(
      <KitchenDisplayScreen
        data={{
          ...sampleKitchenDisplayResponse,
          tables: sampleKitchenDisplayResponse.tables.map((row) => ({
            ...row,
            liveOverlay: null
          })),
          activeOrders: {
            ...sampleKitchenDisplayResponse.activeOrders,
            inHouse: []
          }
        }}
        isLoading={false}
        error={null}
      />
    );

    const statsBar = screen.getByLabelText(/service stats/i);

    expect(screen.getByRole("button", { name: /live order 12/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /live order 12/i })).toHaveStyle({
      background: "rgba(90, 93, 100, 0.42)"
    });
    expect(screen.queryByTestId("live-segment-food_ordered-12")).not.toBeInTheDocument();
    expect(within(statsBar).getByText(/total bookings/i)).toBeInTheDocument();
    expect(within(statsBar).getByText("2")).toBeInTheDocument();
    expect(within(statsBar).getByText("1 remaining")).toBeInTheDocument();
    expect(screen.getByLabelText("Eat-In")).toHaveTextContent(/no active orders/i);
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

  it("renders mocked reviews in the footer and opens review detail in the right pane", () => {
    render(
      <KitchenDisplayScreen
        data={sampleKitchenDisplayResponse}
        isLoading={false}
        error={null}
      />
    );

    expect(screen.getByLabelText(/reviews/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /open review by cein mcgillicuddy/i }));

    const details = screen.getByLabelText(/review details/i);

    expect(within(details).getByRole("heading", { name: /cein mcgillicuddy/i })).toBeInTheDocument();
    expect(
      within(details).getByText(/this is the best thai restaurant/i)
    ).toBeInTheDocument();
  });

  it("replaces review detail with order detail when a live order is selected from the planner", () => {
    render(
      <KitchenDisplayScreen
        data={sampleKitchenDisplayResponse}
        isLoading={false}
        error={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /open review by cein mcgillicuddy/i }));
    fireEvent.click(screen.getByRole("button", { name: /live order 12/i }));

    expect(screen.queryByLabelText(/review details/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/order details/i)).toBeInTheDocument();
  });

  it("shows an out-of-hours overlay outside the service window", () => {
    render(
      <KitchenDisplayScreen
        data={{
          ...sampleKitchenDisplayResponse,
          timeline: {
            ...sampleKitchenDisplayResponse.timeline,
            now: "2026-07-18T23:30:00Z"
          }
        }}
        isLoading={false}
        error={null}
      />
    );

    expect(
      screen.getByText(/outside service hours\. live updates resume at 10:00\./i)
    ).toBeInTheDocument();
    expect(screen.getByTestId("service-window-overlay")).toBeInTheDocument();
  });

  it("does not show the out-of-hours overlay during service hours", () => {
    render(
      <KitchenDisplayScreen
        data={sampleKitchenDisplayResponse}
        isLoading={false}
        error={null}
      />
    );

    expect(screen.queryByTestId("service-window-overlay")).not.toBeInTheDocument();
  });
});
