# Google Reviews Operations Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a typed Google Places review adapter, mocked review data, a footer reviews rail, and a right-pane review detail flow to the operations board.

**Architecture:** Keep Google-specific response shapes isolated in a dedicated types file and adapter, normalize reviews into app-friendly models, and integrate them into the existing `KitchenDisplayScreen` detail-selection pattern. Reuse the current board layout by adding a sibling footer section next to bill calls and sharing the right pane between order details and review details.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library

---

## File Structure

- Create: `src/types/googleReviews.ts`
  - Raw Google Places review shapes and normalized board review types
- Create: `src/lib/googleReviews.ts`
  - Adapter and utility functions for review normalization
- Create: `src/lib/googleReviews.test.ts`
  - Unit tests for adapter behavior
- Create: `src/test/fixtures/googleReviews.ts`
  - Mocked review data and raw Google fixture data
- Create: `src/components/ReviewsFooter.tsx`
  - Compact footer section for review cards and empty state
- Create: `src/components/ReviewsFooter.test.tsx`
  - Component tests for footer rendering and click behavior
- Create: `src/components/ReviewDetailDrawer.tsx`
  - Right-pane review detail renderer
- Create: `src/components/ReviewDetailDrawer.test.tsx`
  - Component tests for review detail rendering
- Modify: `src/screens/KitchenDisplayScreen.tsx`
  - Integrate normalized reviews, shared detail selection, and new footer section
- Modify: `src/screens/KitchenDisplayScreen.test.tsx`
  - Screen-level interaction tests for review selection and drawer swapping

### Task 1: Define Google Review Types and Adapter

**Files:**
- Create: `src/types/googleReviews.ts`
- Create: `src/lib/googleReviews.ts`
- Create: `src/lib/googleReviews.test.ts`
- Create: `src/test/fixtures/googleReviews.ts`

- [ ] **Step 1: Write the failing adapter test**

```ts
import { describe, expect, it } from "vitest";
import { normalizeGooglePlaceReview } from "./googleReviews";
import { rawGooglePlaceReviewFixture } from "../test/fixtures/googleReviews";

describe("normalizeGooglePlaceReview", () => {
  it("maps a Google Places review into the board review shape", () => {
    const review = normalizeGooglePlaceReview(
      rawGooglePlaceReviewFixture,
      "2026-07-19T05:16:28Z"
    );

    expect(review).toEqual({
      id: "places/mock-place/reviews/review-1",
      source: "google_places",
      authorName: "C\u00e9in McGillicuddy",
      authorProfileUri: "https://www.google.com/maps/contrib/mock-user-1/reviews",
      authorPhotoUri: "https://lh3.googleusercontent.com/a/mock-user-1",
      rating: 5,
      publishedAt: "2026-07-19T02:16:28Z",
      relativePublishedText: "3 hours ago",
      text:
        "This is the best Thai restaurant I\u2019ve ever visited outside of Thailand. Just incredible.",
      originalText:
        "This is the best Thai restaurant I\u2019ve ever visited outside of Thailand. Just incredible.",
      googleMapsUri: "https://maps.google.com/?cid=review-1",
      isNewWithin25Hours: true
    });
  });

  it("falls back to original text and marks older reviews as not new", () => {
    const review = normalizeGooglePlaceReview(
      {
        ...rawGooglePlaceReviewFixture,
        name: "places/mock-place/reviews/review-2",
        publishTime: "2026-07-18T00:00:00Z",
        relativePublishTimeDescription: "a day ago",
        text: undefined,
        originalText: {
          text: "Beautiful room, lovely food.",
          languageCode: "en"
        }
      },
      "2026-07-19T05:16:28Z"
    );

    expect(review.text).toBe("Beautiful room, lovely food.");
    expect(review.originalText).toBe("Beautiful room, lovely food.");
    expect(review.isNewWithin25Hours).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/lib/googleReviews.test.ts`

Expected: FAIL with module resolution errors such as `Cannot find module './googleReviews'`.

- [ ] **Step 3: Write minimal types, fixture, and adapter implementation**

```ts
// src/types/googleReviews.ts
export type GoogleLocalizedText = {
  text?: string;
  languageCode?: string;
};

export type GoogleAuthorAttribution = {
  displayName?: string;
  uri?: string;
  photoUri?: string;
};

export type GooglePlaceReview = {
  name: string;
  relativePublishTimeDescription?: string;
  rating?: number;
  publishTime?: string;
  googleMapsUri?: string;
  flagContentUri?: string;
  visitDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  text?: GoogleLocalizedText;
  originalText?: GoogleLocalizedText;
  authorAttribution?: GoogleAuthorAttribution;
};

export type BoardReview = {
  id: string;
  source: "mock" | "google_places";
  authorName: string;
  authorProfileUri: string | null;
  authorPhotoUri: string | null;
  rating: number | null;
  publishedAt: string | null;
  relativePublishedText: string | null;
  text: string | null;
  originalText: string | null;
  googleMapsUri: string | null;
  isNewWithin25Hours: boolean;
};
```

```ts
// src/test/fixtures/googleReviews.ts
import type { BoardReview, GooglePlaceReview } from "../types/googleReviews";

export const rawGooglePlaceReviewFixture: GooglePlaceReview = {
  name: "places/mock-place/reviews/review-1",
  relativePublishTimeDescription: "3 hours ago",
  rating: 5,
  publishTime: "2026-07-19T02:16:28Z",
  googleMapsUri: "https://maps.google.com/?cid=review-1",
  text: {
    text: "This is the best Thai restaurant I\u2019ve ever visited outside of Thailand. Just incredible.",
    languageCode: "en"
  },
  originalText: {
    text: "This is the best Thai restaurant I\u2019ve ever visited outside of Thailand. Just incredible.",
    languageCode: "en"
  },
  authorAttribution: {
    displayName: "C\u00e9in McGillicuddy",
    uri: "https://www.google.com/maps/contrib/mock-user-1/reviews",
    photoUri: "https://lh3.googleusercontent.com/a/mock-user-1"
  }
};

export const mockBoardReviews: BoardReview[] = [
  {
    id: "places/mock-place/reviews/review-1",
    source: "mock",
    authorName: "C\u00e9in McGillicuddy",
    authorProfileUri: "https://www.google.com/maps/contrib/mock-user-1/reviews",
    authorPhotoUri: "https://lh3.googleusercontent.com/a/mock-user-1",
    rating: 5,
    publishedAt: "2026-07-19T02:16:28Z",
    relativePublishedText: "3 hours ago",
    text:
      "This is the best Thai restaurant I\u2019ve ever visited outside of Thailand. Just incredible. The food. The decor. The incredibly friendly and welcoming service from the manager Meiji and all of his happy, smiling staff.",
    originalText:
      "This is the best Thai restaurant I\u2019ve ever visited outside of Thailand. Just incredible. The food. The decor. The incredibly friendly and welcoming service from the manager Meiji and all of his happy, smiling staff.",
    googleMapsUri: "https://maps.google.com/?cid=review-1",
    isNewWithin25Hours: true
  },
  {
    id: "places/mock-place/reviews/review-2",
    source: "mock",
    authorName: "Nuchie Nuchie",
    authorProfileUri: null,
    authorPhotoUri: null,
    rating: 5,
    publishedAt: "2026-07-18T05:00:00Z",
    relativePublishedText: "a day ago",
    text: null,
    originalText: null,
    googleMapsUri: "https://maps.google.com/?cid=review-2",
    isNewWithin25Hours: false
  }
];
```

```ts
// src/lib/googleReviews.ts
import type { BoardReview, GooglePlaceReview } from "../types/googleReviews";

const NEW_REVIEW_WINDOW_MS = 25 * 60 * 60 * 1000;

function getReviewText(review: GooglePlaceReview) {
  return review.text?.text ?? review.originalText?.text ?? null;
}

export function normalizeGooglePlaceReview(
  review: GooglePlaceReview,
  nowIso: string
): BoardReview {
  const publishedAt = review.publishTime ?? null;
  const isNewWithin25Hours =
    publishedAt != null
      ? new Date(nowIso).getTime() - new Date(publishedAt).getTime() <= NEW_REVIEW_WINDOW_MS
      : false;

  return {
    id: review.name,
    source: "google_places",
    authorName: review.authorAttribution?.displayName ?? "Anonymous reviewer",
    authorProfileUri: review.authorAttribution?.uri ?? null,
    authorPhotoUri: review.authorAttribution?.photoUri ?? null,
    rating: review.rating ?? null,
    publishedAt,
    relativePublishedText: review.relativePublishTimeDescription ?? null,
    text: getReviewText(review),
    originalText: review.originalText?.text ?? getReviewText(review),
    googleMapsUri: review.googleMapsUri ?? null,
    isNewWithin25Hours
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/lib/googleReviews.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/googleReviews.ts src/lib/googleReviews.ts src/lib/googleReviews.test.ts src/test/fixtures/googleReviews.ts
git commit -m "feat: add google review adapter types"
```

### Task 2: Build Review Footer and Review Detail Drawer

**Files:**
- Create: `src/components/ReviewsFooter.tsx`
- Create: `src/components/ReviewsFooter.test.tsx`
- Create: `src/components/ReviewDetailDrawer.tsx`
- Create: `src/components/ReviewDetailDrawer.test.tsx`

- [ ] **Step 1: Write the failing component tests**

```ts
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockBoardReviews } from "../test/fixtures/googleReviews";
import { ReviewsFooter } from "./ReviewsFooter";
import { ReviewDetailDrawer } from "./ReviewDetailDrawer";

describe("ReviewsFooter", () => {
  it("renders compact review cards and emits selection events", () => {
    const onSelect = vi.fn();

    render(<ReviewsFooter reviews={mockBoardReviews} onSelect={onSelect} />);

    expect(screen.getByLabelText(/reviews/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open review by c\u00e9in mcgillicuddy/i })).toBeInTheDocument();
    expect(screen.getByText(/new/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /open review by c\u00e9in mcgillicuddy/i }));

    expect(onSelect).toHaveBeenCalledWith("places/mock-place/reviews/review-1");
  });

  it("renders an empty state when there are no reviews", () => {
    render(<ReviewsFooter reviews={[]} onSelect={() => {}} />);

    expect(screen.getByText(/no recent reviews/i)).toBeInTheDocument();
  });
});

describe("ReviewDetailDrawer", () => {
  it("renders full review metadata and fallback text handling", () => {
    render(<ReviewDetailDrawer review={mockBoardReviews[1]} onClose={() => {}} />);

    expect(screen.getByRole("heading", { name: "Nuchie Nuchie" })).toBeInTheDocument();
    expect(screen.getByText(/a day ago/i)).toBeInTheDocument();
    expect(screen.getByText(/no review text provided/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test src/components/ReviewsFooter.test.tsx src/components/ReviewDetailDrawer.test.tsx`

Expected: FAIL with module resolution errors for missing components.

- [ ] **Step 3: Write minimal review footer and review drawer implementations**

```tsx
// src/components/ReviewsFooter.tsx
import type { BoardReview } from "../types/googleReviews";

type Props = {
  reviews: BoardReview[];
  onSelect: (reviewId: string) => void;
};

export function ReviewsFooter({ reviews, onSelect }: Props) {
  return (
    <section aria-label="Reviews" style={{ display: "grid", gap: "10px" }}>
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
          overflowX: "auto"
        }}
      >
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <button
              key={review.id}
              type="button"
              aria-label={`Open review by ${review.authorName}`}
              onClick={() => onSelect(review.id)}
              style={{
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(17, 24, 24, 0.78)",
                color: "var(--color-text)",
                display: "grid",
                gap: "4px"
              }}
            >
              <strong style={{ fontSize: "14px" }}>{review.authorName}</strong>
              <span style={{ fontSize: "12px", color: "var(--color-subtle)" }}>
                {`${review.rating ?? "-"} stars • ${review.relativePublishedText ?? "Unknown time"}`}
              </span>
              {review.isNewWithin25Hours ? (
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#f0d27a" }}>NEW</span>
              ) : null}
              <span style={{ fontSize: "13px", lineHeight: 1.2 }}>
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
```

```tsx
// src/components/ReviewDetailDrawer.tsx
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
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "grid", gap: "4px" }}>
          <h2 style={{ margin: 0, fontSize: "28px", lineHeight: 1 }}>{review.authorName}</h2>
          <p style={{ margin: 0, fontSize: "14px" }}>{`${review.rating ?? "-"} stars`}</p>
          <p style={{ margin: 0, fontSize: "14px" }}>{review.relativePublishedText ?? "Unknown time"}</p>
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
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
      <p style={{ margin: 0, fontSize: "18px", lineHeight: 1.4 }}>
        {review.text ?? "No review text provided."}
      </p>
      {review.googleMapsUri ? (
        <a href={review.googleMapsUri} target="_blank" rel="noreferrer">
          Open in Google Maps
        </a>
      ) : null}
    </aside>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test src/components/ReviewsFooter.test.tsx src/components/ReviewDetailDrawer.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ReviewsFooter.tsx src/components/ReviewsFooter.test.tsx src/components/ReviewDetailDrawer.tsx src/components/ReviewDetailDrawer.test.tsx
git commit -m "feat: add review footer and detail drawer"
```

### Task 3: Integrate Reviews Into the Screen and Shared Detail Flow

**Files:**
- Modify: `src/screens/KitchenDisplayScreen.tsx`
- Modify: `src/screens/KitchenDisplayScreen.test.tsx`

- [ ] **Step 1: Write the failing screen tests**

```ts
it("renders mocked reviews in the footer and opens review detail in the right pane", () => {
  render(
    <KitchenDisplayScreen
      data={sampleKitchenDisplayResponse}
      isLoading={false}
      error={null}
    />
  );

  expect(screen.getByLabelText(/reviews/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /open review by c\u00e9in mcgillicuddy/i }));

  const details = screen.getByLabelText(/review details/i);

  expect(within(details).getByRole("heading", { name: /c\u00e9in mcgillicuddy/i })).toBeInTheDocument();
  expect(within(details).getByText(/this is the best thai restaurant/i)).toBeInTheDocument();
});

it("replaces review detail with order detail when an order is selected", () => {
  render(
    <KitchenDisplayScreen
      data={sampleKitchenDisplayResponse}
      isLoading={false}
      error={null}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: /open review by c\u00e9in mcgillicuddy/i }));
  fireEvent.click(screen.getByRole("button", { name: /open order 12/i }));

  expect(screen.queryByLabelText(/review details/i)).not.toBeInTheDocument();
  expect(screen.getByLabelText(/order details/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test src/screens/KitchenDisplayScreen.test.tsx`

Expected: FAIL because the screen does not yet render reviews or support review detail selection.

- [ ] **Step 3: Write minimal screen integration**

```tsx
// inside src/screens/KitchenDisplayScreen.tsx
import { ReviewDetailDrawer } from "../components/ReviewDetailDrawer";
import { ReviewsFooter } from "../components/ReviewsFooter";
import { mockBoardReviews } from "../test/fixtures/googleReviews";
import type { BoardReview } from "../types/googleReviews";

type DetailSelection =
  | null
  | { type: "order"; displayRef: string }
  | { type: "review"; reviewId: string };

function findSelectedReview(reviews: BoardReview[], reviewId: string | null) {
  if (reviewId == null) {
    return null;
  }

  return reviews.find((review) => review.id === reviewId) ?? null;
}

const reviews = mockBoardReviews;
const [detailSelection, setDetailSelection] = useState<DetailSelection>(null);
const selectedOrder =
  detailSelection?.type === "order"
    ? findSelectedOrder(data, detailSelection.displayRef)
    : null;
const selectedReview =
  detailSelection?.type === "review"
    ? findSelectedReview(reviews, detailSelection.reviewId)
    : null;

<ServiceBoard
  rows={boardRows}
  timeline={...}
  onSelect={(displayRef) => setDetailSelection({ type: "order", displayRef })}
/>;

<section className={styles.sidePanel}>
  {selectedReview ? (
    <ReviewDetailDrawer review={selectedReview} onClose={() => setDetailSelection(null)} />
  ) : selectedOrder ? (
    <OrderDetailDrawer order={selectedOrder} onClose={() => setDetailSelection(null)} />
  ) : (
    <>
      <OrderLane title="Eat-In" orders={sortActiveOrders(data?.activeOrders.inHouse ?? [])} onSelect={(displayRef) => setDetailSelection({ type: "order", displayRef })} />
      <OrderLane title="Takeaway" orders={sortActiveOrders(data?.activeOrders.takeaway ?? [])} onSelect={(displayRef) => setDetailSelection({ type: "order", displayRef })} />
    </>
  )}
</section>

<section style={{ marginTop: "14px", display: "grid", gap: "12px" }}>
  <BillCallFooter
    calls={billCalls}
    dismissedCallIds={dismissedCallIds}
    onDismiss={dismissBillCall}
  />
  <ReviewsFooter
    reviews={reviews}
    onSelect={(reviewId) => setDetailSelection({ type: "review", reviewId })}
  />
</section>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn test src/screens/KitchenDisplayScreen.test.tsx`

Expected: PASS

- [ ] **Step 5: Run focused regression tests**

Run: `yarn test src/lib/googleReviews.test.ts src/components/ReviewsFooter.test.tsx src/components/ReviewDetailDrawer.test.tsx src/screens/KitchenDisplayScreen.test.tsx`

Expected: PASS

- [ ] **Step 6: Run full build verification**

Run: `yarn build`

Expected: PASS with Vite production bundle generated in `dist/`

- [ ] **Step 7: Commit**

```bash
git add src/screens/KitchenDisplayScreen.tsx src/screens/KitchenDisplayScreen.test.tsx
git commit -m "feat: add mocked reviews to operations board"
```
