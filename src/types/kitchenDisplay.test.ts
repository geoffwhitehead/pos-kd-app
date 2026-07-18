import { describe, expect, it } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";

describe("sampleKitchenDisplayResponse", () => {
  it("includes timeline rows and print-category summaries", () => {
    expect(sampleKitchenDisplayResponse.timeline.startHour).toBe(12);
    expect(sampleKitchenDisplayResponse.timeline.endHour).toBe(22);
    expect(sampleKitchenDisplayResponse.tables[0]?.bookings[0]?.startsAt).toBe(
      "2026-07-18T18:00:00Z"
    );
    expect(
      sampleKitchenDisplayResponse.activeOrders.inHouse[0]?.categorySummary[1]
        ?.label
    ).toBe("Mains");
  });
});
