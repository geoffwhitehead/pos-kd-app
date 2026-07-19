import { useEffect, useMemo, useState } from "react";
import { BillCallFooter, type FooterBillCall } from "../components/BillCallFooter";
import { OrderDetailDrawer } from "../components/OrderDetailDrawer";
import { OrderLane } from "../components/OrderLane";
import { ReviewDetailDrawer } from "../components/ReviewDetailDrawer";
import { ReviewsFooter } from "../components/ReviewsFooter";
import { ServiceBoard } from "../components/ServiceBoard";
import { SystemWarningBanner } from "../components/SystemWarningBanner";
import { getServiceStats } from "../lib/boardStats";
import { formatShortTime } from "../lib/format";
import { sortActiveOrders, sortServiceBoardRows } from "../lib/sort";
import { mockBoardReviews } from "../mocks/googleReviews";
import { getServiceDateString } from "../lib/time";
import type { BoardReview } from "../types/googleReviews";
import type {
  ActiveOrderCard,
  KitchenDisplayResponse,
  RetainedActiveOrder,
  ServiceBoardRow
} from "../types/kitchenDisplay";
import styles from "./KitchenDisplayScreen.module.css";

type DetailSelection =
  | null
  | { type: "order"; displayRef: string }
  | { type: "review"; reviewId: string };

type Props = {
  data: KitchenDisplayResponse | null;
  isLoading: boolean;
  error: string | null;
};

function findSelectedOrder(
  data: KitchenDisplayResponse | null,
  selectedDisplayRef: string | null
): ActiveOrderCard | null {
  if (data == null || selectedDisplayRef == null) {
    return null;
  }

  return (
    [
      ...data.activeOrders.inHouse,
      ...data.activeOrders.takeaway,
      ...data.activeOrders.unassigned
    ].find((order) => order.displayRef === selectedDisplayRef) ?? null
  );
}

function findSelectedReview(reviews: BoardReview[], reviewId: string | null) {
  if (reviewId == null) {
    return null;
  }

  return reviews.find((review) => review.id === reviewId) ?? null;
}

function getBillCalls(data: KitchenDisplayResponse | null): FooterBillCall[] {
  return [...(data?.activeOrders.inHouse ?? [])]
    .flatMap((order) =>
      (order.tableCalls ?? []).map((call) => ({
        ...call,
        dismissalKey: `${order.billId}:${call.id}`
      }))
    )
    .filter(
      (call) =>
        call != null &&
        call.id != null &&
        call.calledAt != null &&
        call.dismissalKey.length > 0
    )
    .sort((left, right) => new Date(left.calledAt).getTime() - new Date(right.calledAt).getTime());
}

function getRowForOrder(rows: ServiceBoardRow[], order: ActiveOrderCard) {
  return (
    rows.find((row) => row.liveOverlay?.billId === order.billId) ??
    rows.find((row) => row.displayRef === order.displayRef) ??
    null
  );
}

function inferOrderCovers(row: ServiceBoardRow | null, order: ActiveOrderCard) {
  if (row == null || row.liveOverlay == null) {
    return 0;
  }

  const overlappingBooking = row.bookings.find((booking) => {
    const bookingStart = new Date(booking.startsAt).getTime();
    const bookingEnd = new Date(booking.endsAt).getTime();
    const orderStart = new Date(order.createdAt).getTime();

    return bookingStart <= orderStart && bookingEnd >= orderStart;
  });

  return overlappingBooking?.covers ?? 0;
}

function buildRetainedOrders(data: KitchenDisplayResponse | null): RetainedActiveOrder[] {
  if (data == null) {
    return [];
  }

  const serviceDate = getServiceDateString(data.timeline.now);

  return data.activeOrders.inHouse.map((order) => {
    const row = getRowForOrder(data.tables, order);
    const liveOverlay =
      row?.liveOverlay ?? {
        billId: order.billId,
        displayRef: order.displayRef,
        status: order.status,
        startsAt: order.createdAt,
        endsAt: order.updatedAt,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        openedAt: order.createdAt,
        foodOrderedAt: null,
        calledAt: null,
        tableCalls: order.tableCalls,
        categorySummary: order.categorySummary,
        hasBookingMatch: false
      };

    return {
      billId: order.billId,
      displayRef: order.displayRef,
      tableRef: row?.tableRef ?? order.displayRef,
      floor: row?.floor ?? "Service Floor",
      serviceDate,
      inferredCovers: inferOrderCovers(row, order),
      order,
      liveOverlay
    };
  });
}

function mergeRetainedRows(rows: ServiceBoardRow[], retainedOrders: RetainedActiveOrder[]) {
  const rowsByDisplayRef = new Map(rows.map((row) => [row.displayRef, row]));
  const mergedRows = [...rows];

  for (const retainedOrder of retainedOrders) {
    const existingRow = rowsByDisplayRef.get(retainedOrder.displayRef);

    if (existingRow) {
      if (existingRow.liveOverlay == null) {
        existingRow.liveOverlay = retainedOrder.liveOverlay;
      }

      continue;
    }

    mergedRows.push({
      displayRef: retainedOrder.displayRef,
      tableRef: retainedOrder.tableRef,
      floor: retainedOrder.floor,
      bookings: [],
      liveOverlay: retainedOrder.liveOverlay
    });
  }

  return mergedRows;
}

export function KitchenDisplayScreen({ data, isLoading, error }: Props) {
  const [detailSelection, setDetailSelection] = useState<DetailSelection>(null);
  const [dismissedCallIds, setDismissedCallIds] = useState<string[]>([]);
  const [retainedOrders, setRetainedOrders] = useState<RetainedActiveOrder[]>(() =>
    buildRetainedOrders(data)
  );
  const reviews = mockBoardReviews;
  const selectedOrder =
    detailSelection?.type === "order"
      ? findSelectedOrder(data, detailSelection.displayRef)
      : null;
  const selectedReview =
    detailSelection?.type === "review"
      ? findSelectedReview(reviews, detailSelection.reviewId)
      : null;
  const currentTime = data?.timeline.now ?? new Date().toISOString();
  const serviceDate = getServiceDateString(currentTime);
  const currentRetainedOrders = useMemo(() => buildRetainedOrders(data), [data]);
  const boardRows = useMemo(
    () => sortServiceBoardRows(mergeRetainedRows(data?.tables ?? [], retainedOrders)),
    [data, retainedOrders]
  );
  const stats = getServiceStats(data, retainedOrders);
  const billCalls = useMemo(() => getBillCalls(data), [data]);
  const liveDismissalKeys = useMemo(
    () => new Set(billCalls.map((call) => call.dismissalKey)),
    [billCalls]
  );

  useEffect(() => {
    setRetainedOrders((currentOrders) => {
      const currentServiceOrders = currentOrders.filter((order) => order.serviceDate === serviceDate);
      const nextOrdersByBillId = new Map(currentServiceOrders.map((order) => [order.billId, order]));

      for (const retainedOrder of currentRetainedOrders) {
        nextOrdersByBillId.set(retainedOrder.billId, retainedOrder);
      }

      return [...nextOrdersByBillId.values()];
    });
  }, [currentRetainedOrders, serviceDate]);

  useEffect(() => {
    setDismissedCallIds((currentIds) => {
      const nextIds = currentIds.filter((dismissalKey) => liveDismissalKeys.has(dismissalKey));

      return nextIds.length === currentIds.length ? currentIds : nextIds;
    });
  }, [liveDismissalKeys]);

  function dismissBillCall(dismissalKey: string) {
    setDismissedCallIds((currentIds) =>
      currentIds.includes(dismissalKey) ? currentIds : [...currentIds, dismissalKey]
    );
  }

  return (
    <main className={styles.screen}>
      <section className={styles.statsBar} aria-label="Service stats">
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Bookings</span>
          <strong className={styles.statValue}>{stats.totalBookings}</strong>
          <span className={styles.statMeta}>{stats.totalBookingsRemaining} remaining</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Covers</span>
          <strong className={styles.statValue}>{stats.totalCovers}</strong>
          <span className={styles.statMeta}>{stats.totalCoversRemaining} remaining</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Active Tables</span>
          <strong className={styles.statValue}>{stats.activeTables}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Kitchen Cheques</span>
          <strong className={styles.statValue}>{stats.kitchenCheques}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Ordering Soon</span>
          <strong className={styles.statValue}>{stats.orderingSoonTables}</strong>
          <span className={styles.statMeta}>{stats.orderingSoonCovers} covers</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Due In Next 30</span>
          <strong className={styles.statValue}>{stats.dueNext30.tables}</strong>
          <span className={styles.statMeta}>{stats.dueNext30.covers} covers</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Due In 60 Min</span>
          <strong className={styles.statValue}>{stats.dueIn60.tables}</strong>
          <span className={styles.statMeta}>{stats.dueIn60.covers} covers</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Takeaway Live</span>
          <strong className={styles.statValue}>{stats.takeawayLive}</strong>
        </div>
        <div className={`${styles.statCard} ${styles.clockCard}`}>
          <span className={styles.statLabel}>Time</span>
          <strong className={styles.statValue}>{formatShortTime(currentTime)}</strong>
        </div>
      </section>

      <SystemWarningBanner warnings={data?.warnings ?? []} error={error} />

      <section className={styles.columns}>
        <section aria-label="Service board panel" className={styles.panel}>
          <ServiceBoard
            rows={boardRows}
            timeline={
              data?.timeline ?? {
                startHour: 12,
                endHour: 22,
                now: new Date().toISOString()
              }
            }
            onSelect={(displayRef) => setDetailSelection({ type: "order", displayRef })}
          />
        </section>

        <section aria-label="Active orders panel" className={`${styles.panel} ${styles.rightStack}`}>
          {selectedReview ? (
            <ReviewDetailDrawer review={selectedReview} onClose={() => setDetailSelection(null)} />
          ) : selectedOrder ? (
            <OrderDetailDrawer
              order={selectedOrder}
              onClose={() => setDetailSelection(null)}
            />
          ) : (
            <>
              <OrderLane
                title="Eat-In"
                orders={sortActiveOrders(data?.activeOrders.inHouse ?? [])}
                currentTime={currentTime}
                onSelect={(displayRef) => setDetailSelection({ type: "order", displayRef })}
              />
              <OrderLane
                title="Takeaway"
                orders={sortActiveOrders(data?.activeOrders.takeaway ?? [])}
                currentTime={currentTime}
                onSelect={(displayRef) => setDetailSelection({ type: "order", displayRef })}
              />
              {(data?.activeOrders.unassigned.length ?? 0) > 0 ? (
                <OrderLane
                  title="Needs Review"
                  orders={sortActiveOrders(data?.activeOrders.unassigned ?? [])}
                  currentTime={currentTime}
                  onSelect={(displayRef) => setDetailSelection({ type: "order", displayRef })}
                />
              ) : null}
            </>
          )}
        </section>
      </section>

      <section
        data-testid="footer-rail"
        style={{
          marginTop: "14px",
          display: "flex",
          gap: "12px",
          alignItems: "stretch",
          minWidth: 0,
          overflow: "hidden"
        }}
      >
        <BillCallFooter
          calls={billCalls}
          dismissedCallIds={dismissedCallIds}
          onDismiss={dismissBillCall}
          style={{
            flex: "1 1 108px",
            minWidth: "108px"
          }}
        />
        <ReviewsFooter
          reviews={reviews}
          onSelect={(reviewId) => setDetailSelection({ type: "review", reviewId })}
          style={{
            flex: "0 1 460px",
            maxWidth: "460px",
            minWidth: 0
          }}
        />
      </section>
    </main>
  );
}
