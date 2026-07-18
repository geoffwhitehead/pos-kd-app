import type { KitchenDisplayResponse, ServiceBoardRow } from "../types/kitchenDisplay";
import {
  floorToHalfHourInServiceTimeZone,
  formatServiceClockTime,
  getServiceDateString,
  getServiceHour,
  localTimeOnServiceDateToIso
} from "./time";

type TimelineBounds = {
  startHour: number;
  endHour: number;
  serviceDate: string;
  startIso?: string;
  endIso?: string;
};

export function buildTimelineSlots(startHour: number, endHour: number) {
  const totalHalfHours = (endHour - startHour) * 2;

  return Array.from({ length: totalHalfHours + 1 }, (_, index) => {
    const hour = startHour + Math.floor(index / 2);
    const minutes = index % 2 === 0 ? "00" : "30";

    return `${String(hour).padStart(2, "0")}:${minutes}`;
  });
}

export function buildTimelineSlotsForWindow(startIso: string, endIso: string) {
  const slots: string[] = [];
  const start = new Date(startIso);
  const end = new Date(endIso);

  for (let value = start.getTime(); value <= end.getTime(); value += 30 * 60 * 1000) {
    slots.push(formatServiceClockTime(new Date(value)));
  }

  return slots;
}

function buildRange(bounds: TimelineBounds) {
  if (bounds.startIso && bounds.endIso) {
    return {
      start: new Date(bounds.startIso),
      end: new Date(bounds.endIso)
    };
  }

  return {
    start: new Date(localTimeOnServiceDateToIso(bounds.serviceDate, bounds.startHour)),
    end: new Date(localTimeOnServiceDateToIso(bounds.serviceDate, bounds.endHour))
  };
}

function overlapsWindow(startIso: string, endIso: string, windowStartIso: string, windowEndIso: string) {
  return new Date(endIso).getTime() > new Date(windowStartIso).getTime()
    && new Date(startIso).getTime() < new Date(windowEndIso).getTime();
}

export function buildVisibleBoardTimeline(
  rows: ServiceBoardRow[],
  timeline: KitchenDisplayResponse["timeline"]
) {
  const serviceDate = getServiceDateString(timeline.now);
  const dayEndIso = localTimeOnServiceDateToIso(serviceDate, timeline.endHour);
  const nowMs = new Date(timeline.now).getTime();
  const earliestActiveStartIso = rows
    .flatMap((row) =>
      row.liveOverlay && new Date(row.liveOverlay.endsAt).getTime() >= nowMs
        ? [row.liveOverlay.startsAt]
        : []
    )
    .sort()[0];
  const visibleStartCandidate =
    earliestActiveStartIso && earliestActiveStartIso < timeline.now
      ? earliestActiveStartIso
      : timeline.now;
  const startIso = floorToHalfHourInServiceTimeZone(visibleStartCandidate);

  return {
    ...timeline,
    startHour: getServiceHour(startIso),
    startIso,
    endIso: dayEndIso,
    serviceDate
  };
}

export function filterRowsForVisibleWindow(
  rows: ServiceBoardRow[],
  visibleTimeline: ReturnType<typeof buildVisibleBoardTimeline>
) {
  return rows
    .map((row) => {
      const bookings = row.bookings.filter((booking) =>
        overlapsWindow(booking.startsAt, booking.endsAt, visibleTimeline.startIso, visibleTimeline.endIso)
      );
      const liveOverlay =
        row.liveOverlay &&
        overlapsWindow(
          row.liveOverlay.startsAt,
          row.liveOverlay.endsAt,
          visibleTimeline.startIso,
          visibleTimeline.endIso
        )
          ? row.liveOverlay
          : null;

      return {
        ...row,
        bookings,
        liveOverlay
      };
    })
    .filter((row) => row.bookings.length > 0 || row.liveOverlay != null);
}

export function toTimelinePercent(isoValue: string, bounds: TimelineBounds) {
  const { start, end } = buildRange(bounds);
  const value = new Date(isoValue);
  const ratio =
    (value.getTime() - start.getTime()) / (end.getTime() - start.getTime());

  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

export function buildSegmentStyle(
  startIso: string,
  endIso: string,
  bounds: TimelineBounds
) {
  const left = toTimelinePercent(startIso, bounds);
  const right = toTimelinePercent(endIso, bounds);

  return {
    left: `${left}%`,
    width: `${Math.max(right - left, 2)}%`
  };
}
