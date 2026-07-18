import type { ActiveOrderCard as ActiveOrderCardType } from "../types/kitchenDisplay";
import { OrderCard } from "./OrderCard";

type Props = {
  title: string;
  orders: ActiveOrderCardType[];
  currentTime: string;
  onSelect: (displayRef: string) => void;
};

const ONE_HOUR_MS = 60 * 60 * 1000;

function splitOrdersByAge(orders: ActiveOrderCardType[], currentTime: string) {
  const now = new Date(currentTime).getTime();

  return orders.reduce<{
    current: ActiveOrderCardType[];
    aged: ActiveOrderCardType[];
  }>(
    (accumulator, order) => {
      const ageMs = now - new Date(order.createdAt).getTime();

      if (ageMs >= ONE_HOUR_MS) {
        accumulator.aged.push(order);
      } else {
        accumulator.current.push(order);
      }

      return accumulator;
    },
    { current: [], aged: [] }
  );
}

export function OrderLane({ title, orders, currentTime, onSelect }: Props) {
  const { current, aged } = splitOrdersByAge(orders, currentTime);
  const shouldSplitIntoRail = title === "In House" && aged.length > 0;
  const compactGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "8px",
    alignItems: "start"
  } as const;

  return (
    <section aria-label={title}>
      <h3 style={{ marginBottom: "10px" }}>{title}</h3>
      {orders.length === 0 ? (
        <p>No active orders.</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {shouldSplitIntoRail ? (
            <section aria-label={`${title} current cheques`}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-subtle)" }}>
                Current Cheques
              </h4>
              <div
                style={compactGridStyle}
              >
                {current.map((order) => (
                  <OrderCard
                    key={`${order.serviceType}-${order.displayRef}`}
                    order={order}
                    onPress={() => onSelect(order.displayRef)}
                  />
                ))}
              </div>
            </section>
          ) : null}
          <section aria-label={shouldSplitIntoRail ? `${title} aged cheques` : `${title} cheques`}>
            {shouldSplitIntoRail ? (
              <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-subtle)" }}>
                Older Than 1 Hour
              </h4>
            ) : null}
            <div
              style={
                shouldSplitIntoRail
                  ? compactGridStyle
                  : {
                      ...compactGridStyle,
                      gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))"
                    }
              }
            >
              {(shouldSplitIntoRail ? aged : orders).map((order) => (
                <OrderCard
                  key={`${order.serviceType}-${order.displayRef}`}
                  order={order}
                  onPress={() => onSelect(order.displayRef)}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
