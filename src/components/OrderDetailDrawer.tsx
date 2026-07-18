import { formatShortTime, formatStatusLabel, formatUpdatedAt } from "../lib/format";
import type { ActiveOrderCard } from "../types/kitchenDisplay";

type Props = {
  order: ActiveOrderCard | null;
  onClose: () => void;
};

export function OrderDetailDrawer({ order, onClose }: Props) {
  if (order == null) {
    return null;
  }

  return (
    <aside aria-label="Order details">
      <h2>Order Details</h2>
      <p>Reference: {order.displayRef}</p>
      <p>Booking: {order.bookingName ?? order.partyName ?? "No booking"}</p>
      <p>Status: {formatStatusLabel(order.status)}</p>
      <p>Created: {formatShortTime(order.createdAt)}</p>
      <p>Last updated: {formatUpdatedAt(order.updatedAt)}</p>
      <ul>
        {order.categorySummary.map((summary) => (
          <li key={summary.key}>
            {summary.count} {summary.label.toLowerCase()}
          </li>
        ))}
      </ul>
      <ul>
        {order.items.map((item) => (
          <li key={item.billItemId}>
            {item.quantity} x {item.name}
          </li>
        ))}
      </ul>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </aside>
  );
}
