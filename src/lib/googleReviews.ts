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
  const nowTime = new Date(nowIso).getTime();
  const publishedTime = publishedAt == null ? Number.NaN : new Date(publishedAt).getTime();
  const isNewWithin25Hours =
    Number.isFinite(publishedTime) && nowTime - publishedTime <= NEW_REVIEW_WINDOW_MS;
  const text = getReviewText(review);

  return {
    id: review.name,
    source: "google_places",
    authorName: review.authorAttribution?.displayName ?? "Anonymous reviewer",
    authorProfileUri: review.authorAttribution?.uri ?? null,
    authorPhotoUri: review.authorAttribution?.photoUri ?? null,
    rating: review.rating ?? null,
    publishedAt,
    relativePublishedText: review.relativePublishTimeDescription ?? null,
    text,
    originalText: review.originalText?.text ?? text,
    googleMapsUri: review.googleMapsUri ?? null,
    isNewWithin25Hours
  };
}
