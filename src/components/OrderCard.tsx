import { KitchenItemContext, KitchenOfferLabel } from "./KitchenItemContext";
import { ChequeActivity } from "./ChequeActivity";
import { formatKitchenItemTime, formatShortTime } from "../lib/format";
import {
  getFirstKitchenItemTime,
  groupKitchenItemsByCategory,
} from "../lib/kitchenOrders";
import type { ActiveOrderCard as ActiveOrderCardType } from "../types/kitchenDisplay";

type Props = {
  order: ActiveOrderCardType;
  onPress: () => void;
  size?: "default" | "compact";
  currentTime?: string;
};

export function OrderCard({
  order,
  onPress,
  size = "default",
  currentTime = new Date().toISOString(),
}: Props) {
  const firstKitchenItemTime = getFirstKitchenItemTime(order.items);
  const groupedItems = groupKitchenItemsByCategory(order.items);
  const callTimes = order.tableCalls.map((call) =>
    formatShortTime(call.calledAt),
  );
  const isCalled = order.tableCalls.length > 0;
  const isCompact = size === "compact";

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={`Open order ${order.displayRef}`}
      data-card-size={size}
      style={{
        width: "100%",
        textAlign: "left",
        minHeight: isCompact ? "124px" : "168px",
        padding: isCompact ? "8px 8px 10px" : "10px 10px 12px",
        borderRadius: isCompact ? "8px" : "10px",
        border: "1px solid var(--color-border)",
        background: "var(--color-receipt)",
        color: "#231f1b",
        boxShadow: "none",
        display: "grid",
        gridTemplateRows: "auto auto 1fr",
        gap: isCompact ? "6px" : "8px",
        alignContent: "start",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "10px",
          borderBottom: "1px dashed rgba(35, 31, 27, 0.22)",
          paddingBottom: isCompact ? "5px" : "6px",
        }}
      >
        <div style={{ display: "grid", gap: "3px" }}>
          <strong
            style={{
              fontSize: isCompact ? "20px" : "24px",
              lineHeight: 0.9,
              letterSpacing: "-0.04em",
            }}
          >
            {order.displayRef}
          </strong>
        </div>
        <span
          style={{
            fontSize: "11px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: isCalled ? "#8f251d" : "rgba(35, 31, 27, 0.68)",
            fontVariantCaps: "all-small-caps",
            textAlign: "right",
            display: "grid",
            gap: isCompact ? "2px" : "3px",
            justifyItems: "end",
          }}
        >
          {isCalled ? (
            <>
              <span
                style={{
                  padding: "2px 7px",
                  borderRadius: "999px",
                  background: "rgba(181, 58, 50, 0.14)",
                  border: "1px solid rgba(181, 58, 50, 0.26)",
                  fontSize: isCompact ? "11px" : "12px",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: "#8f251d",
                  boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.16) inset",
                }}
              >
                Called
              </span>
              <span
                style={{
                  fontSize: isCompact ? "11px" : "12px",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  textTransform: "none",
                  color: "#8f251d",
                }}
              >
                {callTimes.join(", ")}
              </span>
            </>
          ) : null}
        </span>
      </div>
      <div style={{ display: "grid", gap: "2px" }}>
        <span
          style={{
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "rgba(35, 31, 27, 0.52)",
            fontVariantCaps: "all-small-caps",
          }}
        >
          Fired
        </span>
        <span
          style={{
            fontSize: isCompact ? "12px" : "13px",
            color: "rgba(35, 31, 27, 0.82)",
          }}
        >
          {formatKitchenItemTime(firstKitchenItemTime)}
        </span>
        <ChequeActivity order={order} currentTime={currentTime} />
      </div>
      <div
        style={{
          display: "grid",
          gap: isCompact ? "6px" : "8px",
          alignContent: "start",
        }}
      >
        {groupedItems.map((group) => (
          <section key={group.category}>
            <h3
              style={{
                margin: "0 0 4px",
                fontSize: isCompact ? "9px" : "10px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "rgba(35, 31, 27, 0.58)",
                borderBottom: "1px dashed rgba(35, 31, 27, 0.16)",
                paddingBottom: "3px",
              }}
            >
              {group.category.toUpperCase()}
            </h3>
            <ul
              style={{
                margin: 0,
                paddingLeft: isCompact ? "12px" : "14px",
                display: "grid",
                gap: isCompact ? "3px" : "4px",
              }}
            >
              {group.items.map((item) => (
                <li
                  key={item.billItemId}
                  style={{
                    lineHeight: 1.15,
                    fontSize: isCompact ? "10px" : "11px",
                    textTransform: "uppercase",
                    fontVariantCaps: "all-small-caps",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{item.quantity} x</span>{" "}
                  {item.name}
                  <KitchenOfferLabel item={item} />
                  {item.modifiers.length > 0 ? (
                    <span style={{ color: "rgba(35, 31, 27, 0.62)" }}>
                      {" "}
                      ({item.modifiers.join(", ")})
                    </span>
                  ) : null}
                  <KitchenItemContext item={item} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </button>
  );
}
