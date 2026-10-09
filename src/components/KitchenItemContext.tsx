import type { KitchenItem } from "../types/kitchenDisplay";

export function KitchenItemContext({ item }: { item: KitchenItem }) {
  return (
    <>
      {item.offerName ? (
        <span
          data-offer-instance-id={item.offerInstanceId}
          style={{
            display: "block",
            fontSize: "12px",
            fontWeight: 700,
            color: "#37583a",
            marginTop: "4px",
          }}
        >
          Offer: {item.offerName}
        </span>
      ) : null}
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
