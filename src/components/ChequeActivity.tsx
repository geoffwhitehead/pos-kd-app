import {
  getKitchenCategorySummary,
  getLastKitchenActivity,
} from "../lib/kitchenOrders";
import type { ActiveOrderCard } from "../types/kitchenDisplay";

export function ChequeActivity({
  order,
  currentTime,
}: {
  order: ActiveOrderCard;
  currentTime: string;
}) {
  const activity = getLastKitchenActivity(order, currentTime);
  return (
    <div style={{ fontSize: "11px", lineHeight: 1.4, color: "#47423c" }}>
      {activity ? (
        <strong
          style={{ display: "block", fontVariantNumeric: "tabular-nums" }}
        >
          {activity}
        </strong>
      ) : null}
      <span style={{ textTransform: "uppercase", fontSize: "10px" }}>
        {getKitchenCategorySummary(order.items)}
      </span>
    </div>
  );
}
