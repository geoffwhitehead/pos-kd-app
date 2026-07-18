import type { BookingSegment, KitchenDisplayResponse, ServiceBoardRow } from "../types/kitchenDisplay";
import { buildTimelineSlotsForWindow } from "./timeline";

export type PressureBand = "0-30" | "30-60";

export function getBookingTotals(rows: ServiceBoardRow[]) {
  return rows.reduce(
    (totals, row) => {
      for (const booking of row.bookings) {
        totals.totalBookings += 1;
        totals.totalCovers += booking.covers ?? 0;
      }

      return totals;
    },
    {
      totalBookings: 0,
      totalCovers: 0
    }
  );
}

export function getServiceStats(data: KitchenDisplayResponse | null) {
  const rows = data?.tables ?? [];
  const nowIso = data?.timeline.now ?? new Date().toISOString();
  const totals = getBookingTotals(rows);
  const activeTables = rows.filter((row) => row.liveOverlay != null).length;
  const kitchenCheques = data?.activeOrders.inHouse.length ?? 0;
  const takeawayLive = data?.activeOrders.takeaway.length ?? 0;
  const dueNext30 = rows.reduce((covers, row) => {
    return (
      covers +
      row.bookings.reduce((bookingCovers, booking) => {
        const startsAt = new Date(booking.startsAt).getTime();
        const now = new Date(nowIso).getTime();
        const inThirtyMinutes = now + 30 * 60_000;

        if (startsAt < now || startsAt >= inThirtyMinutes) {
          return bookingCovers;
        }

        return bookingCovers + (booking.covers ?? 0);
      }, 0)
    );
  }, 0);

  return {
    ...totals,
    activeTables,
    kitchenCheques,
    takeawayLive,
    dueNext30
  };
}

function arrivesWithinLookbackWindow(
  booking: BookingSegment,
  slotStartIso: string,
  minimumMinutesAgo: number,
  maximumMinutesAgo: number
) {
  const slotStart = new Date(slotStartIso).getTime();
  const bookingStart = new Date(booking.startsAt).getTime();
  const newestIncluded = slotStart - minimumMinutesAgo * 60 * 1000;
  const oldestIncluded = slotStart - maximumMinutesAgo * 60 * 1000;

  return bookingStart >= oldestIncluded && bookingStart < newestIncluded;
}

function countBookingsForBand(
  rows: ServiceBoardRow[],
  slotStartIso: string,
  band: PressureBand
) {
  const [minimumMinutesAgo, maximumMinutesAgo] = band === "0-30" ? [0, 30] : [30, 60];

  return rows.reduce((count, row) => {
    return (
      count +
      row.bookings.filter((booking) =>
        arrivesWithinLookbackWindow(booking, slotStartIso, minimumMinutesAgo, maximumMinutesAgo)
      ).length
    );
  }, 0);
}

export function getBookingPressureBySlot(
  rows: ServiceBoardRow[],
  visibleTimeline: KitchenDisplayResponse["timeline"] & {
    startIso: string;
    endIso: string;
  }
) {
  const slots = buildTimelineSlotsForWindow(visibleTimeline.startIso, visibleTimeline.endIso);

  return slots.slice(0, -1).map((slot, index) => {
    const slotStartIso = new Date(
      new Date(visibleTimeline.startIso).getTime() + index * 30 * 60 * 1000
    ).toISOString();

    return {
      slot,
      starters: countBookingsForBand(rows, slotStartIso, "0-30"),
      mains: countBookingsForBand(rows, slotStartIso, "30-60")
    };
  });
}
