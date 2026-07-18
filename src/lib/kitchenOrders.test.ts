import { describe, expect, it } from "vitest";
import { getFirstKitchenItemTime, groupKitchenItemsByCategory } from "./kitchenOrders";

describe("kitchenOrders", () => {
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
          modifiers: []
        },
        {
          billItemId: "item_2",
          name: "Spring Rolls",
          quantity: 1,
          printCategory: "Starters",
          course: null,
          addedAt: "2026-07-18T18:10:00Z",
          modifiers: []
        }
      ])
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
          modifiers: []
        },
        {
          billItemId: "item_2",
          name: "Spring Rolls",
          quantity: 1,
          printCategory: "Starters",
          course: null,
          addedAt: "2026-07-18T18:10:00Z",
          modifiers: []
        },
        {
          billItemId: "item_3",
          name: "Sticky Toffee Pudding",
          quantity: 1,
          printCategory: "Dessert",
          course: null,
          addedAt: "2026-07-18T18:20:00Z",
          modifiers: []
        },
        {
          billItemId: "item_4",
          name: "Ribeye",
          quantity: 1,
          printCategory: "Mains",
          course: null,
          addedAt: "2026-07-18T18:25:00Z",
          modifiers: []
        }
      ])
    ).toEqual([
      {
        category: "Mains",
        items: [
          expect.objectContaining({ name: "Fish and Chips" }),
          expect.objectContaining({ name: "Ribeye" })
        ]
      },
      {
        category: "Starters",
        items: [expect.objectContaining({ name: "Spring Rolls" })]
      },
      {
        category: "Dessert",
        items: [expect.objectContaining({ name: "Sticky Toffee Pudding" })]
      }
    ]);
  });
});
