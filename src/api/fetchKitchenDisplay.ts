import { buildApiUrl, getApiBaseUrl } from "../config/api";
import { refreshSession } from "./refreshSession";
import { getLatestAuthSession } from "../lib/authStorage";
import {
  getFirstBillCallTime,
  getFirstKitchenItemTime,
} from "../lib/kitchenOrders";
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
  TableCall,
} from "../types/kitchenDisplay";

const BOARD_ENDPOINT = "/api/kd/board/diary";

export type AuthenticatedBoardResponse = {
  data: KitchenDisplayResponse;
  nextSession: AuthSession | null;
};

type ApiBoardRow = {
  tableRef: string;
  bookingTime: string;
  departureTime: string;
  covers: number | null;
  state: string;
  hasOpenBill: boolean;
};

type ApiKitchenItem = {
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
  printMessage?: string;
  offerInstanceId?: string;
  offerName?: string;
  offerShortName?: string;
};

type ApiOrder = {
  billId: string;
  billRef: string;
  displayRef: string;
  serviceType: "dine_in" | "takeaway";
  billCreatedAt?: string;
  billPeriodClosedServiceChargeTotal?: number;
  updatedAt: string;
  hasOpenBill: boolean;
  billCallLogs?: Array<{
    id: string;
    createdAt: string;
    printMessage: string | null;
  }>;
  items: ApiKitchenItem[];
};

type ApiKitchenDisplayResponse = {
  source: "diary";
  warnings: string[];
  freshness: {
    bookingsLastSuccessAt: string | null;
    redisBacked: boolean;
  };
  boardRows: ApiBoardRow[];
  activeOrders: {
    inHouse: ApiOrder[];
    takeaway: ApiOrder[];
  };
};

function summarizeCategories(items: ApiKitchenItem[]): PrintCategorySummary[] {
  const counts = new Map<string, PrintCategorySummary>();

  for (const item of items) {
    const label = item.groupLabel || "Uncategorised";
    const key = label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_");
    const existing = counts.get(key);

    if (existing) {
      existing.count += item.quantity;
      continue;
    }

    counts.set(key, {
      key,
      label,
      count: item.quantity,
    });
  }

  return [...counts.values()];
}

function toKitchenItems(items: ApiKitchenItem[]): KitchenItem[] {
  return items.map((item) => ({
    billItemId: item.id,
    name: item.name,
    quantity: item.quantity,
    printCategory: item.printCategory?.name ?? item.groupLabel,
    course: null,
    addedAt: item.addedAt,
    modifiers: item.modifiers,
    printMessage: item.printMessage,
    offerInstanceId: item.offerInstanceId,
    offerName: item.offerName,
    offerShortName: item.offerShortName,
  }));
}

function filterKitchenItems(items: ApiKitchenItem[]) {
  return items.filter((item) => item.printerGroup?.name === "Kitchen");
}

function toTableCalls(order: ApiOrder): TableCall[] {
  return [...(order.billCallLogs ?? [])]
    .sort((left, right) => {
      return (
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      );
    })
    .map((call) => ({
      id: call.id,
      displayRef: order.displayRef,
      calledAt: call.createdAt,
    }));
}

function toWarning(code: string): DisplayWarning {
  const messageByCode: Record<string, string> = {
    BOOKINGS_STALE: "Bookings data is stale.",
  };

  return {
    code: (code as DisplayWarning["code"]) ?? "BOOKINGS_STALE",
    message: messageByCode[code] ?? code,
  };
}

function toBookingSegment(row: ApiBoardRow): BookingSegment {
  if (!Number.isFinite(Date.parse(row.departureTime))) {
    throw new Error("Booking departure time is missing or invalid");
  }
  return {
    id: `${row.tableRef}-${row.bookingTime}`,
    label: row.tableRef,
    covers: row.covers,
    startsAt: row.bookingTime,
    endsAt: row.departureTime,
  };
}

function toLiveOverlay(order: ApiOrder, nowIso: string): LiveTableOverlay {
  const kitchenItems = filterKitchenItems(order.items);
  const foodOrderedAt = getFirstKitchenItemTime(toKitchenItems(kitchenItems));
  const calledAt = getFirstBillCallTime(order.billCallLogs);
  const openedAt = order.billCreatedAt ?? order.updatedAt;
  const endsAt =
    order.hasOpenBill &&
    new Date(nowIso).getTime() > new Date(order.updatedAt).getTime()
      ? nowIso
      : order.updatedAt;
  const status: LiveTableStatus =
    calledAt != null
      ? "called"
      : foodOrderedAt != null
        ? "food_ordered"
        : "active";

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
    hasBookingMatch: false,
  };
}

function toActiveOrderCard(order: ApiOrder): ActiveOrderCard {
  const foodOrderedAt = getFirstKitchenItemTime(toKitchenItems(order.items));
  const calledAt = getFirstBillCallTime(order.billCallLogs);
  const status: LiveTableStatus =
    calledAt != null
      ? "called"
      : foodOrderedAt != null
        ? "food_ordered"
        : "active";

  return {
    displayRef: order.displayRef,
    serviceType: order.serviceType,
    billId: order.billId,
    billRef: order.billRef,
    bookingName: null,
    partyName: null,
    createdAt: order.billCreatedAt ?? order.updatedAt,
    updatedAt: order.updatedAt,
    billPeriodClosedServiceChargeTotal:
      order.billPeriodClosedServiceChargeTotal ?? 0,
    status,
    categorySummary: summarizeCategories(order.items),
    items: toKitchenItems(order.items),
    tableCalls: toTableCalls(order),
  };
}

function normalizeKitchenDisplayResponse(
  payload: ApiKitchenDisplayResponse,
): KitchenDisplayResponse {
  if (payload.source !== "diary") {
    throw new Error("Expected bookings-api kitchen board");
  }
  const now = new Date().toISOString();
  const bookingsUnavailable = payload.freshness.bookingsLastSuccessAt == null;

  const bookingRowsByTable = payload.boardRows.reduce<
    Map<string, ApiBoardRow[]>
  >((accumulator, row) => {
    const existingRows = accumulator.get(row.tableRef) ?? [];

    existingRows.push(row);
    accumulator.set(row.tableRef, existingRows);
    return accumulator;
  }, new Map());

  // Walk-ins and drinks-only tables still belong on the live board.
  for (const order of payload.activeOrders.inHouse) {
    if (!bookingRowsByTable.has(order.displayRef)) {
      bookingRowsByTable.set(order.displayRef, []);
    }
  }

  const kitchenInHouseOrders = payload.activeOrders.inHouse
    .map((order) => ({
      ...order,
      items: filterKitchenItems(order.items),
    }))
    .filter((order) => order.items.length > 0);

  const kitchenTakeawayOrders = payload.activeOrders.takeaway
    .map((order) => ({
      ...order,
      items: filterKitchenItems(order.items),
    }))
    .filter((order) => order.items.length > 0);

  const tables: ServiceBoardRow[] = [...bookingRowsByTable.entries()].map(
    ([tableRef, rows]) => {
      const sortedRows = [...rows].sort((left, right) =>
        left.bookingTime.localeCompare(right.bookingTime),
      );
      const matchingOrder = payload.activeOrders.inHouse.find(
        (order) => order.displayRef === tableRef,
      );

      return {
        displayRef: tableRef,
        tableRef,
        floor: "Service Floor",
        bookings: sortedRows.map(toBookingSegment),
        liveOverlay:
          matchingOrder == null ? null : toLiveOverlay(matchingOrder, now),
      };
    },
  );

  return {
    generatedAt: now,
    warnings: bookingsUnavailable
      ? [
          {
            code: "BOOKINGS_UNAVAILABLE",
            message: "Bookings data is unavailable.",
          },
        ]
      : payload.warnings.map(toWarning),
    bookingsStatus: bookingsUnavailable
      ? "unavailable"
      : payload.warnings.includes("BOOKINGS_STALE")
        ? "stale"
        : "ok",
    liveOrdersStatus: "ok",
    timeline: {
      startHour: 12,
      endHour: 22,
      now,
    },
    tables,
    activeOrders: {
      inHouse: kitchenInHouseOrders.map((order) => toActiveOrderCard(order)),
      takeaway: kitchenTakeawayOrders.map((order) => toActiveOrderCard(order)),
      unassigned: [],
    },
  };
}

export async function fetchKitchenDisplay(
  session: AuthSession,
): Promise<AuthenticatedBoardResponse> {
  const requestBoard = (tokens: AuthSession) =>
    fetch(buildApiUrl(getApiBaseUrl(), BOARD_ENDPOINT), {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "x-refresh-token": tokens.refreshToken,
        "X-Kitchen-Request": "1",
      },
      signal: AbortSignal.timeout(25_000),
    });
  const currentSession = getLatestAuthSession(session);
  let response = await requestBoard(currentSession);
  let renewedSession: AuthSession | null =
    currentSession !== session ? currentSession : null;
  if (response.status === 401) {
    renewedSession = await refreshSession(currentSession);
    response = await requestBoard(renewedSession);
  }

  if (!response.ok) {
    // A board rejection alone does not establish that the refresh token is invalid.
    // Keep polling; a rejected renewal will explicitly end the session.
    throw new Error(`Kitchen display request failed: ${response.status}`);
  }

  const nextAccessToken = response.headers
    .get("authorization")
    ?.replace("Bearer ", "");
  const nextRefreshToken = response.headers.get("x-refresh-token");

  return {
    data: normalizeKitchenDisplayResponse(
      (await response.json()) as ApiKitchenDisplayResponse,
    ),
    nextSession:
      nextAccessToken != null && nextRefreshToken != null
        ? {
            accessToken: nextAccessToken,
            refreshToken: nextRefreshToken,
          }
        : renewedSession,
  };
}
