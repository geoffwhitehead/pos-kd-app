import { StarRating } from "./StarRating";
import type { BoardReview } from "../types/googleReviews";

type Props = {
  reviews: BoardReview[];
  onSelect: (reviewId: string) => void;
  style?: React.CSSProperties;
};

export function ReviewsFooter({ reviews, onSelect, style }: Props) {
  return (
    <section aria-label="Reviews" style={{ display: "grid", gap: "10px", minWidth: 0, overflow: "hidden", ...style }}>
      <div
        style={{
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--color-subtle)"
        }}
      >
        Reviews
      </div>
      <div
        style={{
          display: "grid",
          gridAutoFlow: "column",
          gridAutoColumns: "minmax(180px, 220px)",
          gap: "8px",
          overflow: "hidden",
          paddingBottom: "2px"
        }}
      >
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <button
              key={review.id}
              data-testid={`review-card-${review.id}`}
              type="button"
              aria-label={`Open review by ${review.authorName}`}
              onClick={() => onSelect(review.id)}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: "12px",
                border: review.isNewWithin25Hours
                  ? "1px solid rgba(240, 210, 122, 0.55)"
                  : "1px solid rgba(255,255,255,0.08)",
                background: review.isNewWithin25Hours
                  ? "linear-gradient(180deg, rgba(36, 33, 19, 0.9), rgba(17, 24, 24, 0.9))"
                  : "rgba(17, 24, 24, 0.78)",
                boxShadow: review.isNewWithin25Hours
                  ? "0 0 0 1px rgba(240, 210, 122, 0.08), 0 0 18px rgba(240, 210, 122, 0.12)"
                  : "none",
                color: "var(--color-text)",
                display: "grid",
                gap: "4px",
                cursor: "pointer",
                minWidth: 0
              }}
            >
              <strong style={{ fontSize: "14px", lineHeight: 1.2 }}>{review.authorName}</strong>
              <div style={{ display: "grid", gap: "4px" }}>
                <StarRating rating={review.rating} size={16} />
                <span style={{ fontSize: "12px", color: "var(--color-subtle)" }}>
                  {review.relativePublishedText ?? "Unknown time"}
                </span>
              </div>
              {review.isNewWithin25Hours ? (
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#f0d27a" }}>NEW</span>
              ) : null}
              <span
                style={{
                  fontSize: "13px",
                  lineHeight: 1.2,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden"
                }}
              >
                {review.text ?? "No review text provided."}
              </span>
            </button>
          ))
        ) : (
          <div
            style={{
              minHeight: "72px",
              borderRadius: "12px",
              border: "1px dashed rgba(255,255,255,0.08)",
              color: "var(--color-subtle)",
              display: "grid",
              placeItems: "center",
              padding: "10px 12px",
              fontSize: "13px"
            }}
          >
            No recent reviews.
          </div>
        )}
      </div>
    </section>
  );
}
