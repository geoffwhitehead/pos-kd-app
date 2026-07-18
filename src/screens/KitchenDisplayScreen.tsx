import { useState } from "react";
import { BillCallFooter } from "../components/BillCallFooter";
import { OrderDetailDrawer } from "../components/OrderDetailDrawer";
import { OrderLane } from "../components/OrderLane";
import { ServiceBoard } from "../components/ServiceBoard";
import { SystemWarningBanner } from "../components/SystemWarningBanner";
import { getServiceStats } from "../lib/boardStats";
import { sortActiveOrders, sortServiceBoardRows } from "../lib/sort";
import type {
  ActiveOrderCard,
  KitchenDisplayResponse
} from "../types/kitchenDisplay";
import styles from "./KitchenDisplayScreen.module.css";

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

function getBillCalls(data: KitchenDisplayResponse | null) {
  return [...(data?.activeOrders.inHouse ?? [])]
    .flatMap((order) => order.tableCalls ?? [])
    .filter((call) => call != null && call.id != null && call.calledAt != null)
    .sort((left, right) => new Date(left.calledAt).getTime() - new Date(right.calledAt).getTime());
}

export function KitchenDisplayScreen({ data, isLoading, error }: Props) {
  const [selectedDisplayRef, setSelectedDisplayRef] = useState<string | null>(null);
  const [dismissedCallIds, setDismissedCallIds] = useState<string[]>([]);
  const selectedOrder = findSelectedOrder(data, selectedDisplayRef);
  const currentTime = data?.timeline.now ?? new Date().toISOString();
  const boardRows = sortServiceBoardRows(data?.tables ?? []);
  const stats = getServiceStats(data);
  const billCalls = getBillCalls(data);

  function dismissBillCall(callId: string) {
    setDismissedCallIds((currentIds) =>
      currentIds.includes(callId) ? currentIds : [...currentIds, callId]
    );
  }

  return (
    <main className={styles.screen}>
      <section className={styles.statsBar} aria-label="Service stats">
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Bookings</span>
          <strong className={styles.statValue}>{stats.totalBookings}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Covers</span>
          <strong className={styles.statValue}>{stats.totalCovers}</strong>
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
          <span className={styles.statLabel}>Due In Next 30</span>
          <strong className={styles.statValue}>{stats.dueNext30}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Takeaway Live</span>
          <strong className={styles.statValue}>{stats.takeawayLive}</strong>
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
            onSelect={setSelectedDisplayRef}
          />
        </section>

        <section aria-label="Active orders panel" className={`${styles.panel} ${styles.rightStack}`}>
          {selectedOrder ? (
            <OrderDetailDrawer
              order={selectedOrder}
              onClose={() => setSelectedDisplayRef(null)}
            />
          ) : (
            <>
              <OrderLane
                title="In House"
                orders={sortActiveOrders(data?.activeOrders.inHouse ?? [])}
                currentTime={currentTime}
                onSelect={setSelectedDisplayRef}
              />
              <OrderLane
                title="Takeaway"
                orders={sortActiveOrders(data?.activeOrders.takeaway ?? [])}
                currentTime={currentTime}
                onSelect={setSelectedDisplayRef}
              />
              {(data?.activeOrders.unassigned.length ?? 0) > 0 ? (
                <OrderLane
                  title="Needs Review"
                  orders={sortActiveOrders(data?.activeOrders.unassigned ?? [])}
                  currentTime={currentTime}
                  onSelect={setSelectedDisplayRef}
                />
              ) : null}
            </>
          )}
        </section>
      </section>

      <BillCallFooter
        calls={billCalls}
        dismissedCallIds={dismissedCallIds}
        onDismiss={dismissBillCall}
      />
    </main>
  );
}
