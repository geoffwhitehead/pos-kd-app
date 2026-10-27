import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchKitchenDisplay } from "./fetchKitchenDisplay";

vi.mock("../config/api", () => ({
  getApiBaseUrl: () => "https://positive-server.herokuapp.com",
  buildApiUrl: (baseUrl: string, path: string) =>
    `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`,
}));

describe("fetchKitchenDisplay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-18T10:42:10.000Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("normalizes the live server board payload into the UI response shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({
          authorization: "Bearer access_456",
          "x-refresh-token": "refresh_789",
        }),
        json: async () => ({
          source: "diary",
          warnings: [],
          freshness: {
            bookingsLastSuccessAt: "2026-07-18T09:21:50.359Z",
            redisBacked: true,
          },
          boardRows: [
            {
              tableRef: "12",
              bookingTime: "2026-07-18T16:00:00.000Z",
              departureTime: "2026-07-18T18:15:00.000Z",
              covers: 2,
              state: "active_booked",
              hasOpenBill: true,
            },
          ],
          activeOrders: {
            inHouse: [
              {
                billId: "bill_12",
                billRef: "12",
                displayRef: "12",
                serviceType: "dine_in",
                billPeriodClosedServiceChargeTotal: 184.2,
                updatedAt: "2026-07-18T16:12:00.000Z",
                hasOpenBill: true,
                items: [
                  {
                    id: "item_1",
                    name: "Soup",
                    printMessage: "Sauce on side",
                    offerInstanceId: "offer-instance-1",
                    offerName: "Lunch special",
                    offerShortName: "LUN",
                    quantity: 2,
                    groupLabel: "Starters",
                    printerGroup: {
                      id: "kitchen",
                      name: "Kitchen",
                    },
                    modifiers: [],
                  },
                  {
                    id: "item_2",
                    name: "Steak",
                    quantity: 1,
                    groupLabel: "Mains",
                    printerGroup: {
                      id: "kitchen",
                      name: "Kitchen",
                    },
                    modifiers: ["Medium rare"],
                  },
                ],
              },
            ],
            takeaway: [],
          },
        }),
      }),
    );

    const response = await fetchKitchenDisplay({
      accessToken: "access_123",
      refreshToken: "refresh_456",
    });

    expect(response.data.activeOrders.inHouse[0]?.items[0]).toMatchObject({
      printMessage: "Sauce on side",
      offerInstanceId: "offer-instance-1",
      offerName: "Lunch special",
      offerShortName: "LUN",
    });
    expect(response.nextSession).toEqual({
      accessToken: "access_456",
      refreshToken: "refresh_789",
    });

    expect(response.data.tables[0]).toMatchObject({
      displayRef: "12",
      tableRef: "12",
      floor: "Service Floor",
    });
    expect(response.data.tables[0]?.bookings[0]).toMatchObject({
      label: "12",
      covers: 2,
      startsAt: "2026-07-18T16:00:00.000Z",
    });
    expect(response.data.activeOrders.inHouse[0]).toMatchObject({
      displayRef: "12",
      bookingName: null,
      status: "active",
      createdAt: "2026-07-18T16:12:00.000Z",
      billPeriodClosedServiceChargeTotal: 184.2,
    });
    expect(response.data.activeOrders.inHouse[0]?.categorySummary).toEqual([
      {
        key: "starters",
        label: "Starters",
        count: 2,
      },
      {
        key: "mains",
        label: "Mains",
        count: 1,
      },
    ]);
    expect(response.data.activeOrders.unassigned).toEqual([]);
    expect(response.data.timeline.startHour).toBe(12);
    expect(response.data.timeline.endHour).toBe(22);
  });

  it("groups bookings with the same table reference into a single service board row", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          source: "diary",
          warnings: [],
          freshness: {
            bookingsLastSuccessAt: "2026-07-18T09:21:50.359Z",
            redisBacked: true,
          },
          boardRows: [
            {
              tableRef: "1",
              bookingTime: "2026-07-18T16:00:00.000Z",
              departureTime: "2026-07-18T18:15:00.000Z",
              covers: 4,
              state: "booked",
              hasOpenBill: false,
            },
            {
              tableRef: "1",
              bookingTime: "2026-07-18T19:30:00.000Z",
              departureTime: "2026-07-18T21:00:00.000Z",
              covers: 2,
              state: "booked",
              hasOpenBill: false,
            },
          ],
          activeOrders: {
            inHouse: [],
            takeaway: [],
          },
        }),
      }),
    );

    const response = await fetchKitchenDisplay({
      accessToken: "access_123",
      refreshToken: "refresh_456",
    });

    expect(response.data.tables).toHaveLength(1);
    expect(response.data.tables[0]?.tableRef).toBe("1");
    expect(response.data.tables[0]?.bookings).toHaveLength(2);
    expect(
      response.data.tables[0]?.bookings.map((booking) => booking.label),
    ).toEqual(["1", "1"]);
  });

  it("uses explicit departure times regardless of covers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          source: "diary",
          warnings: [],
          freshness: {
            bookingsLastSuccessAt: "2026-07-18T09:21:50.359Z",
            redisBacked: true,
          },
          boardRows: [
            {
              tableRef: "1",
              bookingTime: "2026-07-18T16:00:00.000Z",
              departureTime: "2026-07-18T18:15:00.000Z",
              covers: 2,
              state: "booked",
              hasOpenBill: false,
            },
            {
              tableRef: "2",
              bookingTime: "2026-07-18T16:00:00.000Z",
              departureTime: "2026-07-18T18:15:00.000Z",
              covers: 4,
              state: "booked",
              hasOpenBill: false,
            },
            {
              tableRef: "3",
              bookingTime: "2026-07-18T16:00:00.000Z",
              departureTime: "2026-07-18T18:15:00.000Z",
              covers: 6,
              state: "booked",
              hasOpenBill: false,
            },
          ],
          activeOrders: {
            inHouse: [],
            takeaway: [],
          },
        }),
      }),
    );

    const response = await fetchKitchenDisplay({
      accessToken: "access_123",
      refreshToken: "refresh_456",
    });

    expect(
      response.data.tables.find((table) => table.tableRef === "1")?.bookings[0]
        ?.endsAt,
    ).toBe("2026-07-18T18:15:00.000Z");
    expect(
      response.data.tables.find((table) => table.tableRef === "2")?.bookings[0]
        ?.endsAt,
    ).toBe("2026-07-18T18:15:00.000Z");
    expect(
      response.data.tables.find((table) => table.tableRef === "3")?.bookings[0]
        ?.endsAt,
    ).toBe("2026-07-18T18:15:00.000Z");
  });

  it("keeps drinks-only seated tables on the board while hiding them from kitchen cheques", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          source: "diary",
          warnings: [],
          freshness: {
            bookingsLastSuccessAt: "2026-07-18T10:21:50.359Z",
            redisBacked: true,
          },
          boardRows: [
            {
              tableRef: "12",
              bookingTime: "2026-07-18T16:00:00.000Z",
              departureTime: "2026-07-18T18:15:00.000Z",
              covers: 2,
              state: "active_booked",
              hasOpenBill: true,
            },
            {
              tableRef: "7",
              bookingTime: "2026-07-18T17:00:00.000Z",
              departureTime: "2026-07-18T19:15:00.000Z",
              covers: 2,
              state: "active_booked",
              hasOpenBill: true,
            },
          ],
          activeOrders: {
            inHouse: [
              {
                billId: "bill_12",
                billRef: "12",
                displayRef: "12",
                serviceType: "dine_in",
                updatedAt: "2026-07-18T16:12:00.000Z",
                hasOpenBill: true,
                items: [
                  {
                    id: "item_1",
                    name: "Moo Ping",
                    quantity: 1,
                    groupLabel: "none",
                    printCategory: {
                      id: "none",
                      shortName: "none",
                      name: "none",
                    },
                    addedAt: "2026-07-18T10:12:46.523Z",
                    printerGroup: {
                      id: "kitchen",
                      name: "Kitchen",
                    },
                    modifiers: [],
                  },
                  {
                    id: "item_2",
                    name: "Singha",
                    quantity: 1,
                    groupLabel: "drinks",
                    printCategory: {
                      id: "drinks",
                      shortName: "drinks",
                      name: "Drinks",
                    },
                    addedAt: "2026-07-18T10:13:46.523Z",
                    printerGroup: {
                      id: "bar",
                      name: "Bar",
                    },
                    modifiers: [],
                  },
                ],
              },
              {
                billId: "bill_7",
                billRef: "7",
                displayRef: "7",
                serviceType: "dine_in",
                updatedAt: "2026-07-18T17:12:00.000Z",
                hasOpenBill: true,
                items: [
                  {
                    id: "item_3",
                    name: "Beer",
                    quantity: 2,
                    groupLabel: "drinks",
                    printCategory: {
                      id: "drinks",
                      shortName: "drinks",
                      name: "Drinks",
                    },
                    addedAt: "2026-07-18T10:14:46.523Z",
                    printerGroup: {
                      id: "bar",
                      name: "Bar",
                    },
                    modifiers: [],
                  },
                ],
              },
            ],
            takeaway: [],
          },
        }),
      }),
    );

    const response = await fetchKitchenDisplay({
      accessToken: "access_123",
      refreshToken: "refresh_456",
    });

    expect(response.data.activeOrders.inHouse).toHaveLength(1);
    expect(response.data.activeOrders.inHouse[0]?.displayRef).toBe("12");
    expect(response.data.activeOrders.inHouse[0]?.items).toEqual([
      expect.objectContaining({
        name: "Moo Ping",
        quantity: 1,
      }),
    ]);
    expect(
      response.data.tables.find((table) => table.tableRef === "12")
        ?.liveOverlay,
    ).toMatchObject({
      status: "food_ordered",
    });
    expect(
      response.data.tables.find((table) => table.tableRef === "7")?.liveOverlay,
    ).toMatchObject({
      status: "active",
      foodOrderedAt: null,
    });
  });

  it("derives opened, food ordered, and called transition times for live overlays", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers(),
        json: async () => ({
          source: "diary",
          warnings: [],
          freshness: {
            bookingsLastSuccessAt: "2026-07-18T10:42:10.000Z",
            redisBacked: true,
          },
          boardRows: [
            {
              tableRef: "14",
              bookingTime: "2026-07-18T18:00:00.000Z",
              departureTime: "2026-07-18T20:15:00.000Z",
              covers: 4,
              state: "active_booked",
              hasOpenBill: true,
            },
          ],
          activeOrders: {
            inHouse: [
              {
                billId: "bill_14",
                billRef: "14",
                displayRef: "14",
                serviceType: "dine_in",
                billCreatedAt: "2026-07-18T10:12:43.405Z",
                updatedAt: "2026-07-18T10:20:10.000Z",
                hasOpenBill: true,
                billCallLogs: [
                  {
                    id: "call_1",
                    createdAt: "2026-07-18T10:38:57.580Z",
                    printMessage: null,
                  },
                ],
                items: [
                  {
                    id: "item_1",
                    name: "Moo Ping",
                    quantity: 1,
                    groupLabel: "Mains",
                    addedAt: "2026-07-18T10:15:06.758Z",
                    printerGroup: {
                      id: "kitchen",
                      name: "Kitchen",
                    },
                    modifiers: [],
                  },
                  {
                    id: "item_2",
                    name: "Chang",
                    quantity: 1,
                    groupLabel: "Drinks",
                    addedAt: "2026-07-18T10:14:06.758Z",
                    printerGroup: {
                      id: "bar",
                      name: "Bar",
                    },
                    modifiers: [],
                  },
                ],
              },
            ],
            takeaway: [],
          },
        }),
      }),
    );

    const response = await fetchKitchenDisplay({
      accessToken: "access_123",
      refreshToken: "refresh_456",
    });

    expect(response.data.tables[0]?.liveOverlay).toMatchObject({
      status: "called",
      openedAt: "2026-07-18T10:12:43.405Z",
      foodOrderedAt: "2026-07-18T10:15:06.758Z",
      calledAt: "2026-07-18T10:38:57.580Z",
      startsAt: "2026-07-18T10:12:43.405Z",
      endsAt: "2026-07-18T10:42:10.000Z",
    });
    expect(response.data.activeOrders.inHouse[0]?.tableCalls).toEqual([
      {
        id: "call_1",
        displayRef: "14",
        calledAt: "2026-07-18T10:38:57.580Z",
      },
    ]);
  });
});

it("uses the diary departure time instead of a party-size estimate", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers(),
      json: async () => ({
        source: "diary",
        warnings: [],
        freshness: {
          bookingsLastSuccessAt: "2026-10-25T12:00:00Z",
          redisBacked: false,
        },
        boardRows: [
          {
            tableRef: "11",
            bookingTime: "2026-10-25T18:00:00Z",
            departureTime: "2026-10-25T20:45:00Z",
            covers: 2,
            state: "booked",
            hasOpenBill: false,
          },
        ],
        activeOrders: { inHouse: [], takeaway: [] },
      }),
    }),
  );
  try {
    const result = await fetchKitchenDisplay({
      accessToken: "token",
      refreshToken: "refresh",
    });
    expect(JSON.stringify(result.data)).toContain("2026-10-25T20:45:00Z");
  } finally {
    vi.unstubAllGlobals();
  }
});

describe("bookings-api contract", () => {
  const session = { accessToken: "access", refreshToken: "refresh" };
  const board = {
    source: "diary",
    warnings: [],
    freshness: { bookingsLastSuccessAt: "2026-10-27T12:00:00Z" },
    boardRows: [],
    activeOrders: { inHouse: [], takeaway: [] },
  };
  afterEach(() => vi.unstubAllGlobals());

  it.each([undefined, "resos"])(
    "rejects source %s without retrying a legacy feed",
    async (source) => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(Response.json({ ...board, source }));
      vi.stubGlobal("fetch", fetchMock);
      await expect(fetchKitchenDisplay(session)).rejects.toThrow(
        "Expected bookings-api",
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/kd\/board\/diary$/);
    },
  );

  it("does not estimate departure times for an incomplete booking", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          ...board,
          boardRows: [
            { tableRef: "12", bookingTime: "2026-10-27T18:00:00Z", covers: 2 },
          ],
        }),
      ),
    );
    await expect(fetchKitchenDisplay(session)).rejects.toThrow(
      "departure time",
    );
  });

  it.each([true, false])(
    "keeps walk-ins visible when bookings are unavailable: %s",
    async (unavailable) => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          Response.json({
            ...board,
            warnings: unavailable ? ["BOOKINGS_STALE"] : [],
            freshness: {
              bookingsLastSuccessAt: unavailable
                ? null
                : "2026-10-27T12:00:00Z",
            },
            activeOrders: {
              inHouse: [
                {
                  billId: "walk-in",
                  billRef: "12",
                  displayRef: "12",
                  serviceType: "dine_in",
                  updatedAt: "2026-10-27T12:00:00Z",
                  hasOpenBill: true,
                  items: [
                    {
                      id: "beer",
                      name: "Beer",
                      quantity: 1,
                      groupLabel: "Drinks",
                      printerGroup: { id: "bar", name: "Bar" },
                      modifiers: [],
                    },
                  ],
                },
              ],
              takeaway: [],
            },
          }),
        ),
      );
      const { data } = await fetchKitchenDisplay(session);
      expect(data.bookingsStatus).toBe(unavailable ? "unavailable" : "ok");
      expect(data.warnings.map((warning) => warning.code)).toEqual(
        unavailable ? ["BOOKINGS_UNAVAILABLE"] : [],
      );
      expect(Number.isFinite(Date.parse(data.timeline.now))).toBe(true);
      expect(data.tables[0]).toMatchObject({
        tableRef: "12",
        bookings: [],
        liveOverlay: { billId: "walk-in", status: "active" },
      });
      expect(data.activeOrders.inHouse).toEqual([]);
    },
  );
});
