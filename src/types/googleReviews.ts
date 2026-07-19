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

export type BoardReviewSource = "mock" | "google_places";

export type BoardReview = {
  id: string;
  source: BoardReviewSource;
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
