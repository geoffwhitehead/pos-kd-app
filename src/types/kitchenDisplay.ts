export type DataStatus = "ok" | "stale" | "unavailable";
export type LiveTableStatus = "active" | "food_ordered" | "called";

export type DisplayWarningCode =
  | "BOOKINGS_UNAVAILABLE"
  | "BOOKINGS_STALE"
  | "LIVE_ORDERS_UNAVAILABLE"
  | "LIVE_ORDERS_STALE"
  | "UNASSIGNED_ORDER";

export type KitchenItem = {
  billItemId: string;
  name: string;
  quantity: number;
  printCategory: string | null;
  course: string | null;
  addedAt?: string;
  modifiers: string[];
};

export type PrintCategorySummary = {
  key: string;
  label: string;
  count: number;
};

export type TableCall = {
  id: string;
  displayRef: string;
  calledAt: string;
};

export type BookingSegment = {
  id: string;
  label: string;
  covers: number | null;
  startsAt: string;
  endsAt: string;
};

export type LiveTableOverlay = {
  billId: string;
  displayRef: string;
  status: LiveTableStatus;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
  openedAt: string;
  foodOrderedAt: string | null;
  calledAt: string | null;
  tableCalls: TableCall[];
  categorySummary: PrintCategorySummary[];
  hasBookingMatch: boolean;
};

export type ActiveOrderCard = {
  displayRef: string;
  serviceType: "dine_in" | "takeaway" | "unassigned";
  billId: string;
  billRef: string;
  bookingName: string | null;
  partyName: string | null;
  createdAt: string;
  updatedAt: string;
  billPeriodClosedServiceChargeTotal: number;
  status: LiveTableStatus;
  categorySummary: PrintCategorySummary[];
  items: KitchenItem[];
  tableCalls: TableCall[];
};

export type RetainedActiveOrder = {
  billId: string;
  displayRef: string;
  tableRef: string;
  floor: string;
  serviceDate: string;
  inferredCovers: number;
  order: ActiveOrderCard;
  liveOverlay: LiveTableOverlay;
};

export type ServiceBoardRow = {
  displayRef: string;
  tableRef: string;
  floor: string;
  bookings: BookingSegment[];
  liveOverlay: LiveTableOverlay | null;
};

export type DisplayWarning = {
  code: DisplayWarningCode;
  message: string;
};

export type KitchenDisplayResponse = {
  generatedAt: string;
  warnings: DisplayWarning[];
  bookingsStatus: DataStatus;
  liveOrdersStatus: DataStatus;
  timeline: {
    startHour: number;
    endHour: number;
    now: string;
  };
  tables: ServiceBoardRow[];
  activeOrders: {
    inHouse: ActiveOrderCard[];
    takeaway: ActiveOrderCard[];
    unassigned: ActiveOrderCard[];
  };
};
