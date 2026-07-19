import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockBoardReviews } from "../mocks/googleReviews";
import { ReviewDetailDrawer } from "./ReviewDetailDrawer";
import { ReviewsFooter } from "./ReviewsFooter";

describe("ReviewsFooter", () => {
  it("renders compact review cards and emits selection events", () => {
    const onSelect = vi.fn();

    render(<ReviewsFooter reviews={mockBoardReviews} onSelect={onSelect} />);

    expect(screen.getByLabelText(/reviews/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /open review by cein mcgillicuddy/i })
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText(/5 star rating/i)).not.toHaveLength(0);
    expect(screen.getByText(/new/i)).toBeInTheDocument();
    expect(screen.getByTestId("review-card-places/mock-place/reviews/review-1")).toHaveStyle({
      border: "1px solid rgba(240, 210, 122, 0.55)"
    });

    fireEvent.click(screen.getByRole("button", { name: /open review by cein mcgillicuddy/i }));

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
    expect(screen.getByLabelText(/5 star rating/i)).toBeInTheDocument();
    expect(screen.getByText(/a day ago/i)).toBeInTheDocument();
    expect(screen.getByText(/no review text provided/i)).toBeInTheDocument();
  });
});
