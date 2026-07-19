import { describe, expect, it } from "vitest";
import { rawGooglePlaceReviewFixture } from "../test/fixtures/googleReviews";
import { normalizeGooglePlaceReview } from "./googleReviews";

describe("normalizeGooglePlaceReview", () => {
  it("maps a Google Places review into the board review shape", () => {
    const review = normalizeGooglePlaceReview(rawGooglePlaceReviewFixture, "2026-07-19T05:16:28Z");

    expect(review).toEqual({
      id: "places/mock-place/reviews/review-1",
      source: "google_places",
      authorName: "Cein McGillicuddy",
      authorProfileUri: "https://www.google.com/maps/contrib/mock-user-1/reviews",
      authorPhotoUri: "https://lh3.googleusercontent.com/a/mock-user-1",
      rating: 5,
      publishedAt: "2026-07-19T02:16:28Z",
      relativePublishedText: "3 hours ago",
      text:
        "This is the best Thai restaurant I've ever visited outside of Thailand. Just incredible.",
      originalText:
        "This is the best Thai restaurant I've ever visited outside of Thailand. Just incredible.",
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
