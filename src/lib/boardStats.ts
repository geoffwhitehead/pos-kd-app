import type {
  BookingSegment,
  KitchenDisplayResponse,
  RetainedActiveOrder,
  ServiceBoardRow
} from "../types/kitchenDisplay";
import { getServiceDateString } from "./time";
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

function getUpcomingBookingTotals(rows: ServiceBoardRow[], nowIso: string) {
  const now = new Date(nowIso).getTime();
  const recentCutoff = now - 15 * 60_000;

  return rows.reduce(
    (totals, row) => {
      const rowTotals = row.bookings.reduce(
        (bookingTotals, booking) => {
          const startsAt = new Date(booking.startsAt).getTime();

          if (startsAt < recentCutoff) {
            return bookingTotals;
          }

          return {
            bookings: bookingTotals.bookings + 1,
            covers: bookingTotals.covers + (booking.covers ?? 0)
          };
        },
        {
          bookings: 0,
          covers: 0
        }
      );

      return {
        bookings: totals.bookings + rowTotals.bookings,
        covers: totals.covers + rowTotals.covers
      };
    },
    {
      bookings: 0,
      covers: 0
    }
  );
}

function getRemainingBookingTotals(rows: ServiceBoardRow[], nowIso: string) {
  const now = new Date(nowIso).getTime();

  return rows.reduce(
    (totals, row) => {
      const rowTotals = row.bookings.reduce(
        (bookingTotals, booking) => {
          const startsAt = new Date(booking.startsAt).getTime();

          if (startsAt < now) {
            return bookingTotals;
          }

          return {
            bookings: bookingTotals.bookings + 1,
            covers: bookingTotals.covers + (booking.covers ?? 0)
          };
        },
        {
          bookings: 0,
          covers: 0
        }
      );

      return {
        bookings: totals.bookings + rowTotals.bookings,
        covers: totals.covers + rowTotals.covers
      };
    },
    {
      bookings: 0,
      covers: 0
    }
  );
}

function getRetainedTotals(retainedOrders: RetainedActiveOrder[], nowIso: string) {
  const serviceDate = getServiceDateString(nowIso);

  return retainedOrders.reduce(
    (totals, retainedOrder) => {
      if (retainedOrder.serviceDate !== serviceDate) {
        return totals;
      }

      return {
        bookings: totals.bookings + 1,
        covers: totals.covers + retainedOrder.inferredCovers
      };
    },
    {
      bookings: 0,
      covers: 0
    }
  );
}

export function getServiceStats(
  data: KitchenDisplayResponse | null,
  retainedOrders: RetainedActiveOrder[] = []
) {
  const rows = data?.tables ?? [];
  const nowIso = data?.timeline.now ?? new Date().toISOString();
  const remainingToday = getRemainingBookingTotals(rows, nowIso);
  const upcomingTotals = getUpcomingBookingTotals(rows, nowIso);
  const retainedTotals = getRetainedTotals(retainedOrders, nowIso);
  const activeTables = data?.activeOrders.inHouse.length ?? 0;
  const kitchenCheques = data?.activeOrders.inHouse.length ?? 0;
  const takeawayLive = data?.activeOrders.takeaway.length ?? 0;
  const now = new Date(nowIso).getTime();
  const dueNext30 = rows.reduce(
    (totalsForWindow, row) => {
      const rowDue = row.bookings.reduce(
        (bookingTotals, booking) => {
          const startsAt = new Date(booking.startsAt).getTime();
          const inThirtyMinutes = now + 30 * 60_000;

          if (startsAt < now || startsAt >= inThirtyMinutes) {
            return bookingTotals;
          }

          return {
            tables: bookingTotals.tables + 1,
            covers: bookingTotals.covers + (booking.covers ?? 0)
          };
        },
        { tables: 0, covers: 0 }
      );

      return {
        tables: totalsForWindow.tables + rowDue.tables,
        covers: totalsForWindow.covers + rowDue.covers
      };
    },
    { tables: 0, covers: 0 }
  );
  const dueIn60 = rows.reduce(
    (totalsForWindow, row) => {
      const rowDue = row.bookings.reduce(
        (bookingTotals, booking) => {
          const startsAt = new Date(booking.startsAt).getTime();
          const inSixtyMinutes = now + 60 * 60_000;

          if (startsAt < now || startsAt >= inSixtyMinutes) {
            return bookingTotals;
          }

          return {
            tables: bookingTotals.tables + 1,
            covers: bookingTotals.covers + (booking.covers ?? 0)
          };
        },
        { tables: 0, covers: 0 }
      );

      return {
        tables: totalsForWindow.tables + rowDue.tables,
        covers: totalsForWindow.covers + rowDue.covers
      };
    },
    { tables: 0, covers: 0 }
  );
  const orderingSoon = rows.reduce(
    (totalsForSoon, row) => {
      if (row.liveOverlay?.status !== "active") {
        return totalsForSoon;
      }

      const overlappingBookingCovers = row.bookings.reduce((covers, booking) => {
        const overlapsOverlay =
          new Date(booking.endsAt).getTime() > new Date(row.liveOverlay!.startsAt).getTime() &&
          new Date(booking.startsAt).getTime() < new Date(row.liveOverlay!.endsAt).getTime();

        return overlapsOverlay ? covers + (booking.covers ?? 0) : covers;
      }, 0);

      return {
        tables: totalsForSoon.tables + 1,
        covers: totalsForSoon.covers + overlappingBookingCovers
      };
    },
    {
      tables: 0,
      covers: 0
    }
  );

  return {
    totalBookings: upcomingTotals.bookings + retainedTotals.bookings,
    totalCovers: upcomingTotals.covers + retainedTotals.covers,
    totalBookingsRemaining: remainingToday.bookings,
    totalCoversRemaining: remainingToday.covers,
    activeTables,
    kitchenCheques,
    takeawayLive,
    dueNext30,
    dueIn60,
    orderingSoonTables: orderingSoon.tables,
    orderingSoonCovers: orderingSoon.covers
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

function countCoversForBand(rows: ServiceBoardRow[], slotStartIso: string, band: PressureBand) {
  const [minimumMinutesAgo, maximumMinutesAgo] = band === "0-30" ? [0, 30] : [30, 60];

  return rows.reduce((covers, row) => {
    return (
      covers +
      row.bookings.reduce((bookingCovers, booking) => {
        if (
          !arrivesWithinLookbackWindow(booking, slotStartIso, minimumMinutesAgo, maximumMinutesAgo)
        ) {
          return bookingCovers;
        }

        return bookingCovers + (booking.covers ?? 0);
      }, 0)
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
      starterCovers: countCoversForBand(rows, slotStartIso, "0-30"),
      mains: countBookingsForBand(rows, slotStartIso, "30-60"),
      mainCovers: countCoversForBand(rows, slotStartIso, "30-60")
    };
  });
}
