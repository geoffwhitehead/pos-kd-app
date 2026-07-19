import { StarRating } from "./StarRating";
import type { BoardReview } from "../types/googleReviews";

type Props = {
  review: BoardReview | null;
  onClose: () => void;
};

export function ReviewDetailDrawer({ review, onClose }: Props) {
  if (review == null) {
    return null;
  }

  return (
    <aside
      aria-label="Review details"
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
          <h2 style={{ margin: 0, fontSize: "28px", lineHeight: 1 }}>{review.authorName}</h2>
          <StarRating rating={review.rating} size={20} color="#d39b1d" />
          <p style={{ margin: 0, fontSize: "14px" }}>
            {review.relativePublishedText ?? "Unknown time"}
          </p>
          {review.isNewWithin25Hours ? (
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#b53a32"
              }}
            >
              New
            </p>
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
      <p style={{ margin: 0, fontSize: "18px", lineHeight: 1.4 }}>
        {review.text ?? "No review text provided."}
      </p>
    </aside>
  );
}
