import { buildApiUrl, getApiBaseUrl } from "../config/api";
import { getFirstBillCallTime, getFirstKitchenItemTime } from "../lib/kitchenOrders";
import type { AuthSession } from "../types/auth";
import type {
  ActiveOrderCard,
  BookingSegment,
  DisplayWarning,
  KitchenDisplayResponse,
  KitchenItem,
  LiveTableStatus,
  LiveTableOverlay,
  PrintCategorySummary,
  ServiceBoardRow,
  TableCall
} from "../types/kitchenDisplay";

const DEFAULT_ENDPOINT = "/api/kd/board";

export type AuthenticatedBoardResponse = {
  data: KitchenDisplayResponse;
  nextSession: AuthSession | null;
};

type LegacyBoardRow = {
  tableRef: string;
  bookingName: string | null;
  bookingTime: string;
  covers: number | null;
  state: string;
  hasOpenBill: boolean;
};

type LegacyKitchenItem = {
  id: string;
  name: string;
  quantity: number;
  groupLabel: string;
  printCategory?: {
    id: string;
    shortName: string;
    name: string;
  } | null;
  addedAt?: string;
  printerGroup?: {
    id: string;
    name: string;
  } | null;
  modifiers: string[];
};

type LegacyOrder = {
  billId: string;
  billRef: string;
  displayRef: string;
  serviceType: "dine_in" | "takeaway";
  billCreatedAt?: string;
  updatedAt: string;
  hasOpenBill: boolean;
  billCallLogs?: Array<{
    id: string;
    createdAt: string;
    printMessage: string | null;
  }>;
  items: LegacyKitchenItem[];
};

type LegacyKitchenDisplayResponse = {
  warnings: string[];
  freshness: {
    bookingsLastSuccessAt: string;
    redisBacked: boolean;
  };
  boardRows: LegacyBoardRow[];
  activeOrders: {
    inHouse: LegacyOrder[];
    takeaway: LegacyOrder[];
  };
};

function isKitchenDisplayResponse(
  value: KitchenDisplayResponse | LegacyKitchenDisplayResponse
): value is KitchenDisplayResponse {
  return "tables" in value && "timeline" in value;
}

function addMinutes(isoString: string, minutes: number) {
  return new Date(new Date(isoString).getTime() + minutes * 60_000).toISOString();
}

function getBookingDurationMinutes(covers: number | null) {
  if (covers == null) {
    return 90;
  }

  if (covers >= 6) {
    return 150;
  }

  if (covers >= 3) {
    return 120;
  }

  return 90;
}

function summarizeCategories(items: LegacyKitchenItem[]): PrintCategorySummary[] {
  const counts = new Map<string, PrintCategorySummary>();

  for (const item of items) {
    const label = item.groupLabel || "Uncategorised";
    const key = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const existing = counts.get(key);

    if (existing) {
      existing.count += item.quantity;
      continue;
    }

    counts.set(key, {
      key,
      label,
      count: item.quantity
    });
  }

  return [...counts.values()];
}

function toKitchenItems(items: LegacyKitchenItem[]): KitchenItem[] {
  return items.map((item) => ({
    billItemId: item.id,
    name: item.name,
    quantity: item.quantity,
    printCategory: item.printCategory?.name ?? item.groupLabel,
    course: null,
    addedAt: item.addedAt,
    modifiers: item.modifiers
  }));
}

function filterKitchenItems(items: LegacyKitchenItem[]) {
  return items.filter((item) => item.printerGroup?.name === "Kitchen");
}

function toTableCalls(order: LegacyOrder): TableCall[] {
  return [...(order.billCallLogs ?? [])]
    .sort((left, right) => {
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    })
    .map((call) => ({
      id: call.id,
      displayRef: order.displayRef,
      calledAt: call.createdAt
    }));
}

function toWarning(code: string): DisplayWarning {
  const messageByCode: Record<string, string> = {
    BOOKINGS_STALE: "Bookings data is stale."
  };

  return {
    code: (code as DisplayWarning["code"]) ?? "BOOKINGS_STALE",
    message: messageByCode[code] ?? code
  };
}

function toBookingSegment(row: LegacyBoardRow): BookingSegment {
  return {
    id: `${row.tableRef}-${row.bookingTime}`,
    label: row.bookingName ?? row.tableRef,
    covers: row.covers,
    startsAt: row.bookingTime,
    endsAt: addMinutes(row.bookingTime, getBookingDurationMinutes(row.covers))
  };
}

function toLiveOverlay(
  order: LegacyOrder,
  nowIso: string
): LiveTableOverlay {
  const kitchenItems = filterKitchenItems(order.items);
  const foodOrderedAt = getFirstKitchenItemTime(toKitchenItems(kitchenItems));
  const calledAt = getFirstBillCallTime(order.billCallLogs);
  const openedAt = order.billCreatedAt ?? order.updatedAt;
  const endsAt =
    order.hasOpenBill && new Date(nowIso).getTime() > new Date(order.updatedAt).getTime()
      ? nowIso
      : order.updatedAt;
  const status: LiveTableStatus =
    calledAt != null ? "called" : foodOrderedAt != null ? "food_ordered" : "active";

  return {
    billId: order.billId,
    displayRef: order.displayRef,
    status,
    startsAt: openedAt,
    endsAt,
    createdAt: openedAt,
    updatedAt: order.updatedAt,
    openedAt,
    foodOrderedAt,
    calledAt,
    tableCalls: toTableCalls(order),
    categorySummary: summarizeCategories(kitchenItems),
    hasBookingMatch: false
  };
}

function toActiveOrderCard(
  order: LegacyOrder
): ActiveOrderCard {
  const foodOrderedAt = getFirstKitchenItemTime(toKitchenItems(order.items));
  const calledAt = getFirstBillCallTime(order.billCallLogs);
  const status: LiveTableStatus =
    calledAt != null ? "called" : foodOrderedAt != null ? "food_ordered" : "active";

  return {
    displayRef: order.displayRef,
    serviceType: order.serviceType,
    billId: order.billId,
    billRef: order.billRef,
    bookingName: null,
    partyName: null,
    createdAt: order.billCreatedAt ?? order.updatedAt,
    updatedAt: order.updatedAt,
    status,
    categorySummary: summarizeCategories(order.items),
    items: toKitchenItems(order.items),
    tableCalls: toTableCalls(order)
  };
}

function normalizeKitchenDisplayResponse(
  payload: KitchenDisplayResponse | LegacyKitchenDisplayResponse
): KitchenDisplayResponse {
  if (isKitchenDisplayResponse(payload)) {
    return payload;
  }

  const bookingRowsByTable = payload.boardRows.reduce<
    Map<string, LegacyBoardRow[]>
  >((accumulator, row) => {
    const existingRows = accumulator.get(row.tableRef) ?? [];

    existingRows.push(row);
    accumulator.set(row.tableRef, existingRows);
    return accumulator;
  }, new Map());

  const kitchenInHouseOrders = payload.activeOrders.inHouse
    .map((order) => ({
      ...order,
      items: filterKitchenItems(order.items)
    }))
    .filter((order) => order.items.length > 0);

  const kitchenTakeawayOrders = payload.activeOrders.takeaway
    .map((order) => ({
      ...order,
      items: filterKitchenItems(order.items)
    }))
    .filter((order) => order.items.length > 0);

  const tables: ServiceBoardRow[] = [...bookingRowsByTable.entries()].map(
    ([tableRef, rows]) => {
      const sortedRows = [...rows].sort((left, right) =>
        left.bookingTime.localeCompare(right.bookingTime)
      );
      const matchingOrder = payload.activeOrders.inHouse.find(
        (order) => order.displayRef === tableRef
      );

      return {
        displayRef: tableRef,
        tableRef,
        floor: "Service Floor",
        bookings: sortedRows.map(toBookingSegment),
        liveOverlay:
          matchingOrder == null
            ? null
            : toLiveOverlay(matchingOrder, payload.freshness.bookingsLastSuccessAt)
      };
    }
  );

  return {
    generatedAt: payload.freshness.bookingsLastSuccessAt,
    warnings: payload.warnings.map(toWarning),
    bookingsStatus: payload.warnings.includes("BOOKINGS_STALE") ? "stale" : "ok",
    liveOrdersStatus: "ok",
    timeline: {
      startHour: 12,
      endHour: 22,
      now: payload.freshness.bookingsLastSuccessAt
    },
    tables,
    activeOrders: {
      inHouse: kitchenInHouseOrders.map((order) => toActiveOrderCard(order)),
      takeaway: kitchenTakeawayOrders.map((order) => toActiveOrderCard(order)),
      unassigned: []
    }
  };
}

export async function fetchKitchenDisplay(
  session: AuthSession,
  endpoint = DEFAULT_ENDPOINT
): Promise<AuthenticatedBoardResponse> {
  const response = await fetch(buildApiUrl(getApiBaseUrl(), endpoint), {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      "x-refresh-token": session.refreshToken
    }
  });

  if (!response.ok) {
    throw new Error(`Kitchen display request failed: ${response.status}`);
  }

  const nextAccessToken = response.headers
    .get("authorization")
    ?.replace("Bearer ", "");
  const nextRefreshToken = response.headers.get("x-refresh-token");

  return {
    data: normalizeKitchenDisplayResponse(
      (await response.json()) as KitchenDisplayResponse | LegacyKitchenDisplayResponse
    ),
    nextSession:
      nextAccessToken != null && nextRefreshToken != null
        ? {
            accessToken: nextAccessToken,
            refreshToken: nextRefreshToken
          }
        : null
  };
}
