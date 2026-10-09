import { describe, expect, it } from "vitest";
import {
  getFirstKitchenItemTime,
  groupKitchenItemsByCategory,
  getLastKitchenActivity,
  getKitchenCategorySummary,
} from "./kitchenOrders";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";

describe("kitchenOrders", () => {
  it("uses the latest order addition or call without implying completion", () => {
    const order = structuredClone(
      sampleKitchenDisplayResponse.activeOrders.inHouse[0],
    );
    order.items = [{ ...order.items[0], addedAt: "2026-07-18T18:10:00Z" }];
    order.tableCalls = [
      {
        id: "call",
        displayRef: order.displayRef,
        calledAt: "2026-07-18T18:15:00Z",
      },
    ];
    expect(getLastKitchenActivity(order, "2026-07-18T18:17:00Z")).toBe(
      "Called 2m ago",
    );
    order.items = [{ ...order.items[0], addedAt: "2026-07-18T18:16:00Z" }];
    expect(getLastKitchenActivity(order, "2026-07-18T18:17:00Z")).toBe(
      "Ordered 1m ago",
    );
    order.items[0].addedAt = "invalid";
    order.tableCalls = [];
    expect(getLastKitchenActivity(order, "2026-07-18T18:17:00Z")).toBeNull();
  });

  it("summarises quantities rather than item rows", () => {
    const item = sampleKitchenDisplayResponse.activeOrders.inHouse[0].items[0];
    expect(
      getKitchenCategorySummary([
        { ...item, printCategory: "Mains", quantity: 2 },
        { ...item, printCategory: "Mains", quantity: 1 },
        { ...item, printCategory: "Sides", quantity: 2 },
      ]),
    ).toBe("3 Mains · 2 Sides");
  });
  it("returns the earliest kitchen item time for a cheque", () => {
    expect(
      getFirstKitchenItemTime([
        {
          billItemId: "item_1",
          name: "Fish and Chips",
          quantity: 2,
          printCategory: "Mains",
          course: null,
          addedAt: "2026-07-18T18:12:00Z",
          modifiers: [],
        },
        {
          billItemId: "item_2",
          name: "Spring Rolls",
          quantity: 1,
          printCategory: "Starters",
          course: null,
          addedAt: "2026-07-18T18:10:00Z",
          modifiers: [],
        },
      ]),
    ).toBe("2026-07-18T18:10:00Z");
  });

  it("groups kitchen items by category while preserving their order", () => {
    expect(
      groupKitchenItemsByCategory([
        {
          billItemId: "item_1",
          name: "Fish and Chips",
          quantity: 2,
          printCategory: "Mains",
          course: null,
          addedAt: "2026-07-18T18:12:00Z",
          modifiers: [],
        },
        {
          billItemId: "item_2",
          name: "Spring Rolls",
          quantity: 1,
          printCategory: "Starters",
          course: null,
          addedAt: "2026-07-18T18:10:00Z",
          modifiers: [],
        },
        {
          billItemId: "item_3",
          name: "Sticky Toffee Pudding",
          quantity: 1,
          printCategory: "Dessert",
          course: null,
          addedAt: "2026-07-18T18:20:00Z",
          modifiers: [],
        },
        {
          billItemId: "item_4",
          name: "Ribeye",
          quantity: 1,
          printCategory: "Mains",
          course: null,
          addedAt: "2026-07-18T18:25:00Z",
          modifiers: [],
        },
      ]),
    ).toEqual([
      {
        category: "Mains",
        items: [
          expect.objectContaining({ name: "Fish and Chips" }),
          expect.objectContaining({ name: "Ribeye" }),
        ],
      },
      {
        category: "Starters",
        items: [expect.objectContaining({ name: "Spring Rolls" })],
      },
      {
        category: "Dessert",
        items: [expect.objectContaining({ name: "Sticky Toffee Pudding" })],
      },
    ]);
  });
});
