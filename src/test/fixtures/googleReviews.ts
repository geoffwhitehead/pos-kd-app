import type { GooglePlaceReview } from "../../types/googleReviews";

export const rawGooglePlaceReviewFixture: GooglePlaceReview = {
  name: "places/mock-place/reviews/review-1",
  relativePublishTimeDescription: "3 hours ago",
  rating: 5,
  publishTime: "2026-07-19T02:16:28Z",
  googleMapsUri: "https://maps.google.com/?cid=review-1",
  text: {
    text: "This is the best Thai restaurant I've ever visited outside of Thailand. Just incredible.",
    languageCode: "en"
  },
  originalText: {
    text: "This is the best Thai restaurant I've ever visited outside of Thailand. Just incredible.",
    languageCode: "en"
  },
  authorAttribution: {
    displayName: "Cein McGillicuddy",
    uri: "https://www.google.com/maps/contrib/mock-user-1/reviews",
    photoUri: "https://lh3.googleusercontent.com/a/mock-user-1"
  }
};
