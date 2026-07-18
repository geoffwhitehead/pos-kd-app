import { describe, expect, it } from "vitest";
import { buildSegmentStyle, buildTimelineSlots, toTimelinePercent } from "./timeline";

describe("timeline helpers", () => {
  it("builds hourly slots from 12 to 22", () => {
    expect(buildTimelineSlots(12, 22)).toEqual([
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
      "21:00",
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
    ).toBe(50);
  });

  it("builds a left and width style for a timeline segment", () => {
    expect(
      buildSegmentStyle("2026-07-18T18:00:00Z", "2026-07-18T19:00:00Z", {
        startHour: 12,
        endHour: 22,
        serviceDate: "2026-07-18"
      })
    ).toEqual({
      left: "60%",
      width: "10%"
    });
  });
});
