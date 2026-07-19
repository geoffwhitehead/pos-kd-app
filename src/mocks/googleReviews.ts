import type { BoardReview } from "../types/googleReviews";

export const mockBoardReviews: BoardReview[] = [
  {
    id: "places/mock-place/reviews/review-1",
    source: "mock",
    authorName: "Cein McGillicuddy",
    authorProfileUri: "https://www.google.com/maps/contrib/mock-user-1/reviews",
    authorPhotoUri: "https://lh3.googleusercontent.com/a/mock-user-1",
    rating: 5,
    publishedAt: "2026-07-19T02:16:28Z",
    relativePublishedText: "3 hours ago",
    text:
      "This is the best Thai restaurant I've ever visited outside of Thailand. Just incredible. The food. The decor. The incredibly friendly and welcoming service from the manager Meiji and all of his happy, smiling staff.",
    originalText:
      "This is the best Thai restaurant I've ever visited outside of Thailand. Just incredible. The food. The decor. The incredibly friendly and welcoming service from the manager Meiji and all of his happy, smiling staff.",
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
