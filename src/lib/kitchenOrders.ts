import type { KitchenItem } from "../types/kitchenDisplay";

type KitchenItemGroup = {
  category: string;
  items: KitchenItem[];
};

export function getFirstKitchenItemTime(items: KitchenItem[]) {
  const datedItems = items.filter((item) => item.addedAt != null);

  if (datedItems.length === 0) {
    return null;
  }

  return [...datedItems]
    .sort((left, right) => {
      return new Date(left.addedAt ?? "").getTime() - new Date(right.addedAt ?? "").getTime();
    })[0]?.addedAt ?? null;
}

export function getFirstBillCallTime(
  billCallLogs: Array<{ createdAt: string }> | undefined
) {
  if (billCallLogs == null || billCallLogs.length === 0) {
    return null;
  }

  return [...billCallLogs]
    .sort((left, right) => {
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    })[0]?.createdAt ?? null;
}

export function groupKitchenItemsByCategory(items: KitchenItem[]): KitchenItemGroup[] {
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
      items: [item]
    });
  }

  return [...groups.values()];
}
