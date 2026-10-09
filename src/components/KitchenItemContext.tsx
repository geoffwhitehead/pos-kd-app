import type { KitchenItem } from "../types/kitchenDisplay";

export function KitchenOfferLabel({ item }: { item: KitchenItem }) {
  const explicitShortName = item.offerShortName?.replace(/\s+/g, "");
  const initials = item.offerName
    ?.trim()
    .split(/\s+/)
    .map((word) => Array.from(word)[0] ?? "")
    .join("");
  const shortName = (explicitShortName || initials)?.slice(0, 3).toUpperCase();
  if (!shortName) return null;
  return (
    <span
      data-offer-instance-id={item.offerInstanceId}
      title={item.offerName}
      style={{
        display: "inline-block",
        whiteSpace: "nowrap",
        fontSize: "0.9em",
        fontWeight: 800,
        color: "#37583a",
        background: "#f3df90",
        borderRadius: "3px",
        padding: "1px 3px",
        marginLeft: "4px",
        fontVariantCaps: "normal",
      }}
    >
      ({shortName})
    </span>
  );
}

export function KitchenItemContext({ item }: { item: KitchenItem }) {
  return (
    <>
      {item.printMessage ? (
        <span
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 700,
            color: "#8f251d",
            marginTop: "4px",
          }}
        >
          Note: {item.printMessage}
        </span>
      ) : null}
    </>
  );
}
