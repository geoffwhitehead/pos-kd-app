import { useState } from "react";
import { OrderDetailDrawer } from "../components/OrderDetailDrawer";
import { OrderLane } from "../components/OrderLane";
import { ServiceBoard } from "../components/ServiceBoard";
import { SystemWarningBanner } from "../components/SystemWarningBanner";
import { sortActiveOrders, sortServiceBoardRows } from "../lib/sort";
import type { ActiveOrderCard, KitchenDisplayResponse } from "../types/kitchenDisplay";
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

export function KitchenDisplayScreen({ data, isLoading, error }: Props) {
  const [selectedDisplayRef, setSelectedDisplayRef] = useState<string | null>(null);
  const selectedOrder = findSelectedOrder(data, selectedDisplayRef);

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <h1>Kitchen Operations Display</h1>
        <p>{isLoading ? "Loading live service data..." : "Live service board"}</p>
      </header>

      <SystemWarningBanner warnings={data?.warnings ?? []} error={error} />

      <section className={styles.columns}>
        <section
          aria-labelledby="service-board-heading"
          className={styles.panel}
        >
          <h2 id="service-board-heading">Service Board</h2>
          <ServiceBoard
            rows={sortServiceBoardRows(data?.tables ?? [])}
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

        <section
          aria-labelledby="active-orders-heading"
          className={`${styles.panel} ${styles.rightStack}`}
        >
          <h2 id="active-orders-heading">Active Orders</h2>
          <OrderLane
            title="In House"
            orders={sortActiveOrders(data?.activeOrders.inHouse ?? [])}
            onSelect={setSelectedDisplayRef}
          />
          <OrderLane
            title="Takeaway"
            orders={sortActiveOrders(data?.activeOrders.takeaway ?? [])}
            onSelect={setSelectedDisplayRef}
          />
          {(data?.activeOrders.unassigned.length ?? 0) > 0 ? (
            <OrderLane
              title="Needs Review"
              orders={sortActiveOrders(data?.activeOrders.unassigned ?? [])}
              onSelect={setSelectedDisplayRef}
            />
          ) : null}
        </section>
      </section>

      <section className={styles.drawer}>
        <OrderDetailDrawer
          order={selectedOrder}
          onClose={() => setSelectedDisplayRef(null)}
        />
      </section>
    </main>
  );
}
