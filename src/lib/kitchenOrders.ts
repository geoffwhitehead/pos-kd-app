import type { ActiveOrderCard, KitchenItem } from "../types/kitchenDisplay";

export function getLastKitchenActivity(order: ActiveOrderCard, now: string) {
  const events = [
    ...order.items.map((item) => ({ label: "Ordered", at: item.addedAt })),
    ...order.tableCalls.map((call) => ({ label: "Called", at: call.calledAt })),
  ].filter(
    (event) => event.at != null && Number.isFinite(Date.parse(event.at)),
  );
  events.sort((a, b) => Date.parse(b.at!) - Date.parse(a.at!));
  const latest = events[0];
  if (!latest || !Number.isFinite(Date.parse(now))) return null;
  const minutes = Math.max(
    0,
    Math.floor((Date.parse(now) - Date.parse(latest.at!)) / 60000),
  );
  return `${latest.label} ${minutes}m ago`;
}

export function getKitchenCategorySummary(items: KitchenItem[]) {
  return groupKitchenItemsByCategory(items)
    .map(
      (group) =>
        `${group.items.reduce((total, item) => total + item.quantity, 0)} ${group.category}`,
    )
    .join(" · ");
}

type KitchenItemGroup = {
  category: string;
  items: KitchenItem[];
};

export function getFirstKitchenItemTime(items: KitchenItem[]) {
  const datedItems = items.filter((item) => item.addedAt != null);

  if (datedItems.length === 0) {
    return null;
  }

  return (
    [...datedItems].sort((left, right) => {
      return (
        new Date(left.addedAt ?? "").getTime() -
        new Date(right.addedAt ?? "").getTime()
      );
    })[0]?.addedAt ?? null
  );
}

export function getFirstBillCallTime(
  billCallLogs: Array<{ createdAt: string }> | undefined,
) {
  if (billCallLogs == null || billCallLogs.length === 0) {
    return null;
  }

  return (
    [...billCallLogs].sort((left, right) => {
      return (
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      );
    })[0]?.createdAt ?? null
  );
}

export function groupKitchenItemsByCategory(
  items: KitchenItem[],
): KitchenItemGroup[] {
  const groups = new Map<string, KitchenItemGroup>();

  for (const item of items) {
    const category = item.printCategory?.trim() || "Other";
    const existingGroup = groups.get(category);

    if (existingGroup) {
      existingGroup.items.push(item);
      continue;
    }

    groups.set(category, {
      category,
      items: [item],
    });
  }

  return [...groups.values()];
}
