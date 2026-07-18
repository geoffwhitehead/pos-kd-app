import type { ActiveOrderCard, ServiceBoardRow } from "../types/kitchenDisplay";

export function sortServiceBoardRows(rows: ServiceBoardRow[]) {
  return [...rows].sort((left, right) =>
    left.tableRef.localeCompare(right.tableRef, undefined, {
      numeric: true,
      sensitivity: "base"
    })
  );
}

export function sortActiveOrders(orders: ActiveOrderCard[]) {
  return [...orders].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );
}
