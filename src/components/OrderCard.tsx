import { formatStatusLabel, formatUpdatedAt } from "../lib/format";
import type { ActiveOrderCard as ActiveOrderCardType } from "../types/kitchenDisplay";

type Props = {
  order: ActiveOrderCardType;
  onPress: () => void;
};

export function OrderCard({ order, onPress }: Props) {
  return (
    <button type="button" onClick={onPress} aria-label={`Open order ${order.displayRef}`}>
      <strong>{order.displayRef}</strong>
      <span>{order.bookingName ?? order.partyName ?? "Unnamed order"}</span>
      <span>{formatStatusLabel(order.status)}</span>
      <span>Updated {formatUpdatedAt(order.updatedAt)}</span>
      <ul>
        {order.categorySummary.map((summary) => (
          <li key={summary.key}>
            {summary.count} {summary.label.toLowerCase()}
          </li>
        ))}
      </ul>
    </button>
  );
}
