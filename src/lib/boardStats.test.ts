import { describe, expect, it } from "vitest";
import { getBookingPressureBySlot, getServiceStats } from "./boardStats";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";

describe("boardStats", () => {
  it("uses exclusive arrival windows with no overlap at 30 minutes", () => {
    const data = structuredClone(sampleKitchenDisplayResponse);
    const now = Date.parse(data.timeline.now);
    data.tables = [
      {
        ...data.tables[0],
        liveOverlay: null,
        bookings: [-1, 0, 29, 30, 59, 60].map((minutes) => ({
          id: String(minutes),
          label: "Booking",
          covers: 2,
          startsAt: new Date(now + minutes * 60000).toISOString(),
          endsAt: new Date(now + (minutes + 90) * 60000).toISOString(),
        })),
      },
    ];
    const stats = getServiceStats(data);
    expect(stats.dueNext30).toEqual({ tables: 2, covers: 4 });
    expect(stats.dueIn60).toEqual({ tables: 2, covers: 4 });
  });
  it("splits booking pressure into 0-30 and 30-60 minute lookback bands", () => {
    const pressure = getBookingPressureBySlot(
      [
        {
          displayRef: "12",
          tableRef: "12",
          floor: "Ground Floor",
          bookings: [
            {
              id: "booking_12_1",
              label: "Walker",
              covers: 4,
              startsAt: "2026-07-18T18:00:00Z",
              endsAt: "2026-07-18T19:30:00Z",
            },
          ],
          liveOverlay: null,
        },
        {
          displayRef: "13",
          tableRef: "13",
          floor: "Ground Floor",
          bookings: [
            {
              id: "booking_13_1",
              label: "Smith",
              covers: 2,
              startsAt: "2026-07-18T17:50:00Z",
              endsAt: "2026-07-18T19:20:00Z",
            },
            {
              id: "booking_13_2",
              label: "Jones",
              covers: 3,
              startsAt: "2026-07-18T17:20:00Z",
              endsAt: "2026-07-18T18:50:00Z",
            },
          ],
          liveOverlay: null,
        },
      ],
      {
        startHour: 18,
        endHour: 20,
        now: "2026-07-18T18:42:10Z",
        startIso: "2026-07-18T18:00:00.000Z",
        endIso: "2026-07-18T20:00:00.000Z",
      },
    );

    expect(pressure).toEqual([
      {
        slot: "19:00",
        starters: 1,
        starterCovers: 2,
        mains: 1,
        mainCovers: 3,
        desserts: 0,
        dessertCovers: 0,
      },
      {
        slot: "19:30",
        starters: 1,
        starterCovers: 4,
        mains: 1,
        mainCovers: 2,
        desserts: 2 / 5,
        dessertCovers: 3 * (2 / 5),
      },
      {
        slot: "20:00",
        starters: 0,
        starterCovers: 0,
        mains: 1,
        mainCovers: 4,
        desserts: 2 / 5,
        dessertCovers: 2 * (2 / 5),
      },
      {
        slot: "20:30",
        starters: 0,
        starterCovers: 0,
        mains: 0,
        mainCovers: 0,
        desserts: 2 / 5,
        dessertCovers: 4 * (2 / 5),
      },
    ]);
  });

  it("derives the top-line service stats for live pressure and incoming covers", () => {
    const stats = getServiceStats({
      generatedAt: "2026-07-18T18:42:10Z",
      warnings: [],
      bookingsStatus: "ok",
      liveOrdersStatus: "ok",
      timeline: {
        startHour: 12,
        endHour: 22,
        now: "2026-07-18T18:42:10Z",
      },
      tables: [
        {
          displayRef: "12",
          tableRef: "12",
          floor: "Ground Floor",
          bookings: [
            {
              id: "booking_12_1",
              label: "Walker",
              covers: 4,
              startsAt: "2026-07-18T19:00:00Z",
              endsAt: "2026-07-18T21:00:00Z",
            },
          ],
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
            hasBookingMatch: true,
          },
        },
        {
          displayRef: "15",
          tableRef: "15",
          floor: "Ground Floor",
          bookings: [
            {
              id: "booking_15_1",
              label: "Jones",
              covers: 2,
              startsAt: "2026-07-18T19:10:00Z",
              endsAt: "2026-07-18T20:40:00Z",
            },
          ],
          liveOverlay: {
            billId: "bill_15",
            displayRef: "15",
            status: "active",
            startsAt: "2026-07-18T18:20:00Z",
            endsAt: "2026-07-18T18:42:10Z",
            createdAt: "2026-07-18T18:20:00Z",
            updatedAt: "2026-07-18T18:42:10Z",
            openedAt: "2026-07-18T18:20:00Z",
            foodOrderedAt: null,
            calledAt: null,
            tableCalls: [],
            categorySummary: [],
            hasBookingMatch: false,
          },
        },
        {
          displayRef: "16",
          tableRef: "16",
          floor: "First Floor",
          bookings: [
            {
              id: "booking_16_1",
              label: "Late booking",
              covers: 6,
              startsAt: "2026-07-18T19:20:00Z",
              endsAt: "2026-07-18T21:50:00Z",
            },
          ],
          liveOverlay: null,
        },
      ],
      activeOrders: {
        inHouse: [
          {
            displayRef: "12",
            serviceType: "dine_in",
            billId: "bill_12",
            billRef: "12",
            bookingName: "Walker",
            partyName: "Walker",
            createdAt: "2026-07-18T18:10:00Z",
            updatedAt: "2026-07-18T18:42:10Z",
            billPeriodClosedServiceChargeTotal: 184.2,
            status: "food_ordered",
            categorySummary: [],
            items: [
              {
                billItemId: "item_1",
                name: "Fish and Chips",
                quantity: 2,
                printCategory: "Mains",
                course: null,
                addedAt: "2026-07-18T18:12:00Z",
                modifiers: [],
              },
            ],
            tableCalls: [],
          },
          {
            displayRef: "15",
            serviceType: "dine_in",
            billId: "bill_15",
            billRef: "15",
            bookingName: null,
            partyName: null,
            createdAt: "2026-07-18T18:20:00Z",
            updatedAt: "2026-07-18T18:42:10Z",
            billPeriodClosedServiceChargeTotal: 184.2,
            status: "active",
            categorySummary: [],
            items: [],
            tableCalls: [],
          },
        ],
        takeaway: [
          {
            displayRef: "TA1",
            serviceType: "takeaway",
            billId: "bill_ta1",
            billRef: "9001",
            bookingName: null,
            partyName: "Sam",
            createdAt: "2026-07-18T18:30:10Z",
            updatedAt: "2026-07-18T18:45:10Z",
            billPeriodClosedServiceChargeTotal: 183.5,
            status: "called",
            categorySummary: [],
            items: [],
            tableCalls: [],
          },
        ],
        unassigned: [],
      },
    });

    expect(stats).toMatchObject({
      totalBookings: 3,
      totalCovers: 12,
      activeTables: 2,
      kitchenCheques: 2,
      takeawayLive: 1,
      dueNext30: {
        tables: 2,
        covers: 6,
      },
      dueIn60: {
        tables: 1,
        covers: 6,
      },
      cardTipsTotal: 183.5,
      orderingSoonTables: 1,
      orderingSoonCovers: 0,
    });
  });

  it("uses the most recently updated snapshot for cumulative card tips instead of the highest total", () => {
    const stats = getServiceStats({
      generatedAt: "2026-07-18T18:42:10Z",
      warnings: [],
      bookingsStatus: "ok",
      liveOrdersStatus: "ok",
      timeline: {
        startHour: 12,
        endHour: 22,
        now: "2026-07-18T18:42:10Z",
      },
      tables: [],
      activeOrders: {
        inHouse: [
          {
            displayRef: "12",
            serviceType: "dine_in",
            billId: "bill_12",
            billRef: "12",
            bookingName: null,
            partyName: null,
            createdAt: "2026-07-18T18:10:00Z",
            updatedAt: "2026-07-18T18:20:00Z",
            billPeriodClosedServiceChargeTotal: 1000,
            status: "food_ordered",
            categorySummary: [],
            items: [],
            tableCalls: [],
          },
        ],
        takeaway: [
          {
            displayRef: "TA1",
            serviceType: "takeaway",
            billId: "bill_ta1",
            billRef: "9001",
            bookingName: null,
            partyName: null,
            createdAt: "2026-07-18T18:10:00Z",
            updatedAt: "2026-07-18T18:40:00Z",
            billPeriodClosedServiceChargeTotal: 26,
            status: "called",
            categorySummary: [],
            items: [],
            tableCalls: [],
          },
        ],
        unassigned: [],
      },
    });

    expect(stats.cardTipsTotal).toBe(26);
  });

  it("combines board bookings with same-day retained table history for totals and remaining counts", () => {
    const stats = getServiceStats(
      {
        generatedAt: "2026-07-18T18:42:10Z",
        warnings: [],
        bookingsStatus: "ok",
        liveOrdersStatus: "ok",
        timeline: {
          startHour: 12,
          endHour: 22,
          now: "2026-07-18T18:42:10Z",
        },
        tables: [
          {
            displayRef: "12",
            tableRef: "12",
            floor: "Ground Floor",
            bookings: [
              {
                id: "booking_12_1",
                label: "Walker",
                covers: 4,
                startsAt: "2026-07-18T18:00:00Z",
                endsAt: "2026-07-18T19:30:00Z",
              },
            ],
            liveOverlay: null,
          },
          {
            displayRef: "16",
            tableRef: "16",
            floor: "Ground Floor",
            bookings: [
              {
                id: "booking_16_1",
                label: "Lesley",
                covers: 4,
                startsAt: "2026-07-18T20:00:00Z",
                endsAt: "2026-07-18T21:30:00Z",
              },
            ],
            liveOverlay: null,
          },
        ],
        activeOrders: {
          inHouse: [
            {
              displayRef: "12",
              serviceType: "dine_in",
              billId: "bill_12",
              billRef: "12",
              bookingName: "Walker",
              partyName: "Walker",
              createdAt: "2026-07-18T18:10:00Z",
              updatedAt: "2026-07-18T18:42:10Z",
              billPeriodClosedServiceChargeTotal: 184.2,
              status: "food_ordered",
              categorySummary: [],
              items: [],
              tableCalls: [],
            },
          ],
          takeaway: [],
          unassigned: [],
        },
      },
      [
        {
          billId: "bill_12",
          displayRef: "12",
          tableRef: "12",
          floor: "Ground Floor",
          serviceDate: "2026-07-18",
          inferredCovers: 4,
          order: {
            displayRef: "12",
            serviceType: "dine_in",
            billId: "bill_12",
            billRef: "12",
            bookingName: "Walker",
            partyName: "Walker",
            createdAt: "2026-07-18T18:10:00Z",
            updatedAt: "2026-07-18T18:42:10Z",
            billPeriodClosedServiceChargeTotal: 184.2,
            status: "food_ordered",
            categorySummary: [],
            items: [],
            tableCalls: [],
          },
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
            hasBookingMatch: true,
          },
        },
        {
          billId: "bill_walkin_15",
          displayRef: "15",
          tableRef: "15",
          floor: "Ground Floor",
          serviceDate: "2026-07-18",
          inferredCovers: 0,
          order: {
            displayRef: "15",
            serviceType: "dine_in",
            billId: "bill_walkin_15",
            billRef: "15",
            bookingName: null,
            partyName: null,
            createdAt: "2026-07-18T18:22:10Z",
            updatedAt: "2026-07-18T18:35:10Z",
            billPeriodClosedServiceChargeTotal: 184.2,
            status: "active",
            categorySummary: [],
            items: [],
            tableCalls: [],
          },
          liveOverlay: {
            billId: "bill_walkin_15",
            displayRef: "15",
            status: "active",
            startsAt: "2026-07-18T18:22:10Z",
            endsAt: "2026-07-18T18:35:10Z",
            createdAt: "2026-07-18T18:22:10Z",
            updatedAt: "2026-07-18T18:35:10Z",
            openedAt: "2026-07-18T18:22:10Z",
            foodOrderedAt: null,
            calledAt: null,
            tableCalls: [],
            categorySummary: [],
            hasBookingMatch: false,
          },
        },
      ],
    );

    expect(stats).toMatchObject({
      activeTables: 1,
      totalBookings: 3,
      totalBookingsRemaining: 1,
      totalCovers: 8,
      totalCoversRemaining: 4,
    });
  });
});
