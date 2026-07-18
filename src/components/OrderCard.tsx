import { formatKitchenItemTime, formatShortTime } from "../lib/format";
import { getFirstKitchenItemTime } from "../lib/kitchenOrders";
import type { ActiveOrderCard as ActiveOrderCardType } from "../types/kitchenDisplay";

type Props = {
  order: ActiveOrderCardType;
  onPress: () => void;
};

export function OrderCard({ order, onPress }: Props) {
  const firstKitchenItemTime = getFirstKitchenItemTime(order.items);
  const callTimes = order.tableCalls.map((call) => formatShortTime(call.calledAt));
  const isCalled = order.tableCalls.length > 0;

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={`Open order ${order.displayRef}`}
      style={{
        width: "100%",
        textAlign: "left",
        minHeight: "168px",
        padding: "10px 10px 12px",
        borderRadius: "10px",
        border: "1px solid var(--color-border)",
        background:
          "linear-gradient(180deg, rgba(248, 245, 239, 0.98), rgba(238, 232, 223, 0.96))",
        color: "#231f1b",
        boxShadow: "0 10px 24px rgba(0, 0, 0, 0.16)",
        display: "grid",
        gridTemplateRows: "auto auto 1fr",
        gap: "8px",
        alignContent: "start"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "10px",
          borderBottom: "1px dashed rgba(35, 31, 27, 0.22)",
          paddingBottom: "6px"
        }}
      >
        <div style={{ display: "grid", gap: "3px" }}>
          <strong style={{ fontSize: "24px", lineHeight: 0.9, letterSpacing: "-0.04em" }}>
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
            gap: "3px",
            justifyItems: "end"
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
                  fontSize: "12px",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  color: "#8f251d",
                  boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.16) inset"
                }}
              >
                Called
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  textTransform: "none",
                  color: "#8f251d"
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
            fontVariantCaps: "all-small-caps"
          }}
        >
          Fired
        </span>
        <span style={{ fontSize: "13px", color: "rgba(35, 31, 27, 0.82)" }}>
          {formatKitchenItemTime(firstKitchenItemTime)}
        </span>
      </div>
      <ul
        style={{
          margin: 0,
          paddingLeft: "14px",
          display: "grid",
          gap: "4px",
          alignContent: "start"
        }}
      >
        {order.items.map((item) => (
          <li
            key={item.billItemId}
            style={{
              lineHeight: 1.15,
              fontSize: "11px",
              textTransform: "uppercase",
              fontVariantCaps: "all-small-caps"
            }}
          >
            <span style={{ fontWeight: 700 }}>{item.quantity} x</span> {item.name}
            {item.modifiers.length > 0 ? (
              <span style={{ color: "rgba(35, 31, 27, 0.62)" }}>
                {" "}
                ({item.modifiers.join(", ")})
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </button>
  );
}
