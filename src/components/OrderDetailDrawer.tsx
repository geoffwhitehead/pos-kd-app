import { formatShortTime } from "../lib/format";
import { groupKitchenItemsByCategory } from "../lib/kitchenOrders";
import type { ActiveOrderCard } from "../types/kitchenDisplay";

type Props = {
  order: ActiveOrderCard | null;
  onClose: () => void;
};

export function OrderDetailDrawer({ order, onClose }: Props) {
  if (order == null) {
    return null;
  }

  const groupedItems = groupKitchenItemsByCategory(order.items);
  const callTimes = order.tableCalls.map((call) => formatShortTime(call.calledAt));
  const isCalled = order.tableCalls.length > 0;

  return (
    <aside
      aria-label="Order details"
      style={{
        minHeight: "100%",
        padding: "18px",
        borderRadius: "12px",
        border: "1px solid var(--color-border)",
        background:
          "linear-gradient(180deg, rgba(248, 245, 239, 0.98), rgba(238, 232, 223, 0.96))",
        color: "#231f1b",
        display: "grid",
        gap: "14px",
        alignContent: "start"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          borderBottom: "1px dashed rgba(35, 31, 27, 0.24)",
          paddingBottom: "10px"
        }}
      >
        <div style={{ display: "grid", gap: "4px" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "32px",
              lineHeight: 0.95,
              letterSpacing: "0.04em"
            }}
          >
            {order.displayRef}
          </h2>
          {isCalled ? (
            <>
              <p
                style={{
                  margin: 0,
                  fontSize: "11px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#b53a32"
                }}
              >
                Called
              </p>
              <p style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#b53a32" }}>
                {callTimes.join(", ")}
              </p>
            </>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: "1px solid rgba(35, 31, 27, 0.18)",
            borderRadius: "999px",
            background: "rgba(35, 31, 27, 0.08)",
            padding: "8px 12px",
            color: "#231f1b"
          }}
        >
          Close
        </button>
      </div>
      <div style={{ display: "grid", gap: "12px" }}>
        {groupedItems.map((group) => (
          <section
            key={group.category}
            style={{
              display: "grid",
              gap: "8px",
              borderBottom: "1px dashed rgba(35, 31, 27, 0.16)",
              paddingBottom: "10px"
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "12px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(35, 31, 27, 0.58)"
              }}
            >
              {group.category.toUpperCase()}
            </h3>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "grid",
                gap: "7px"
              }}
            >
              {group.items.map((item) => (
                <li
                  key={item.billItemId}
                  style={{
                    display: "grid",
                    gap: "4px",
                    fontSize: "18px",
                    lineHeight: 1.1,
                    textTransform: "uppercase"
                  }}
                >
                  <span>{`${item.quantity} x ${item.name}`.toUpperCase()}</span>
                  {item.modifiers.length > 0 ? (
                    <span
                      style={{
                        fontSize: "12px",
                        letterSpacing: "0.04em",
                        color: "rgba(35, 31, 27, 0.56)"
                      }}
                    >
                      {item.modifiers.join(", ").toUpperCase()}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </aside>
  );
}
