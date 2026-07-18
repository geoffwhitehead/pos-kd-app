import type { ActiveOrderCard as ActiveOrderCardType } from "../types/kitchenDisplay";
import { OrderCard } from "./OrderCard";

type Props = {
  title: string;
  orders: ActiveOrderCardType[];
  onSelect: (displayRef: string) => void;
};

export function OrderLane({ title, orders, onSelect }: Props) {
  return (
    <section aria-label={title}>
      <h3>{title}</h3>
      {orders.length === 0 ? (
        <p>No active orders.</p>
      ) : (
        orders.map((order) => (
          <OrderCard
            key={`${order.serviceType}-${order.displayRef}`}
            order={order}
            onPress={() => onSelect(order.displayRef)}
          />
        ))
      )}
    </section>
  );
}

