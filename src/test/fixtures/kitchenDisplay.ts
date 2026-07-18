import type { KitchenDisplayResponse } from "../../types/kitchenDisplay";

export const sampleKitchenDisplayResponse: KitchenDisplayResponse = {
  generatedAt: "2026-07-18T18:42:10Z",
  warnings: [],
  bookingsStatus: "ok",
  liveOrdersStatus: "ok",
  timeline: {
    startHour: 12,
    endHour: 22,
    now: "2026-07-18T18:42:10Z"
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
          endsAt: "2026-07-18T19:30:00Z"
        }
      ],
      liveOverlay: {
        billId: "bill_abc123",
        displayRef: "12",
        status: "food_ordered",
        startsAt: "2026-07-18T18:10:00Z",
        endsAt: "2026-07-18T18:42:10Z",
        createdAt: "2026-07-18T18:10:00Z",
        updatedAt: "2026-07-18T18:42:10Z",
        categorySummary: [
          {
            key: "starters",
            label: "Starters",
            count: 2
          },
          {
            key: "mains",
            label: "Mains",
            count: 3
          }
        ],
        hasBookingMatch: true
      },
    },
    {
      displayRef: "15",
      tableRef: "15",
      floor: "Ground Floor",
      bookings: [],
      liveOverlay: {
        billId: "bill_walkin_15",
        displayRef: "15",
        status: "active",
        startsAt: "2026-07-18T18:22:10Z",
        endsAt: "2026-07-18T18:42:10Z",
        createdAt: "2026-07-18T18:22:10Z",
        updatedAt: "2026-07-18T18:35:10Z",
        categorySummary: [
          {
            key: "sides",
            label: "Sides",
            count: 1
          }
        ],
        hasBookingMatch: false
      }
    },
    {
      displayRef: "16",
      tableRef: "16",
      floor: "First Floor",
      bookings: [
        {
          id: "booking_16_1",
          label: "Lesley",
          covers: 4,
          startsAt: "2026-07-18T20:00:00Z",
          endsAt: "2026-07-18T21:30:00Z"
        }
      ],
      liveOverlay: null
    }
  ],
  activeOrders: {
    inHouse: [
      {
        displayRef: "12",
        serviceType: "dine_in",
        billId: "bill_abc123",
        billRef: "12",
        bookingName: "Walker",
        partyName: "Walker",
        createdAt: "2026-07-18T18:10:00Z",
        updatedAt: "2026-07-18T18:42:10Z",
        status: "food_ordered",
        categorySummary: [
          {
            key: "starters",
            label: "Starters",
            count: 2
          },
          {
            key: "mains",
            label: "Mains",
            count: 3
          },
          {
            key: "sides",
            label: "Sides",
            count: 2
          },
          {
            key: "dessert",
            label: "Dessert",
            count: 1
          }
        ],
        items: [
          {
            billItemId: "item_1",
            name: "Fish and Chips",
            quantity: 2,
            printCategory: "Mains",
            course: null,
            modifiers: ["No peas"]
          }
        ]
      }
    ],
    takeaway: [
      {
        displayRef: "TA1",
        serviceType: "takeaway",
        billId: "bill_takeaway_1",
        billRef: "9001",
        bookingName: null,
        partyName: "Sam",
        createdAt: "2026-07-18T18:30:10Z",
        updatedAt: "2026-07-18T18:45:10Z",
        status: "called",
        categorySummary: [
          {
            key: "mains",
            label: "Mains",
            count: 1
          },
          {
            key: "sides",
            label: "Sides",
            count: 1
          }
        ],
        items: [
          {
            billItemId: "item_2",
            name: "Burger",
            quantity: 1,
            printCategory: "Mains",
            course: null,
            modifiers: []
          },
          {
            billItemId: "item_3",
            name: "Fries",
            quantity: 1,
            printCategory: "Sides",
            course: null,
            modifiers: []
          }
        ]
      }
    ],
    unassigned: []
  }
};
