import { describe, expect, it } from "vitest";
import {
  buildSegmentStyle,
  buildTimelineSlots,
  buildVisibleBoardTimeline,
  toTimelinePercent
} from "./timeline";

describe("timeline helpers", () => {
  it("builds 30-minute slots from 12:00 to 22:00", () => {
    expect(buildTimelineSlots(12, 22)).toEqual([
      "12:00",
      "12:30",
      "13:00",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
      "17:00",
      "17:30",
      "18:00",
      "18:30",
      "19:00",
      "19:30",
      "20:00",
      "20:30",
      "21:00",
      "21:30",
      "22:00"
    ]);
  });

  it("maps timestamps to a percentage within the board window", () => {
    expect(
      toTimelinePercent("2026-07-18T17:00:00Z", {
        startHour: 12,
        endHour: 22,
        serviceDate: "2026-07-18"
      })
    ).toBe(60);
  });

  it("builds a left and width style for a timeline segment", () => {
    expect(
      buildSegmentStyle("2026-07-18T18:00:00Z", "2026-07-18T19:00:00Z", {
        startHour: 12,
        endHour: 22,
        serviceDate: "2026-07-18"
      })
    ).toEqual({
      left: "70%",
      width: "10%"
    });
  });

  it("builds a visible board window from the earlier of now and the earliest active order", () => {
    expect(
      buildVisibleBoardTimeline(
        [
          {
            displayRef: "12",
            tableRef: "12",
            floor: "Ground Floor",
            bookings: [],
            liveOverlay: {
              billId: "bill_12",
              displayRef: "12",
              status: "food_ordered",
              startsAt: "2026-07-18T18:10:00Z",
              endsAt: "2026-07-18T18:42:10Z",
              createdAt: "2026-07-18T18:10:00Z",
              updatedAt: "2026-07-18T18:42:10Z",
              openedAt: "2026-07-18T18:10:00Z",
              foodOrderedAt: "2026-07-18T18:10:00Z",
              calledAt: null,
              tableCalls: [],
              categorySummary: [],
              hasBookingMatch: false
            }
          }
        ],
        {
          startHour: 12,
          endHour: 22,
          now: "2026-07-18T18:42:10Z"
        }
      )
    ).toMatchObject({
      startIso: "2026-07-18T18:00:00.000Z",
      endIso: "2026-07-18T21:00:00.000Z",
      startHour: 19
    });
  });
});
