import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { mockBoardReviews } from "../mocks/googleReviews";
import { ReviewDetailDrawer } from "./ReviewDetailDrawer";

describe("ReviewDetailDrawer", () => {
  it("renders full review metadata and text without an external maps link", () => {
    render(<ReviewDetailDrawer review={mockBoardReviews[0]} onClose={() => {}} />);

    expect(screen.getByRole("heading", { name: "Cein McGillicuddy" })).toBeInTheDocument();
    expect(screen.getByText(/3 hours ago/i)).toBeInTheDocument();
    expect(screen.getByText(/this is the best thai restaurant/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /open in google maps/i })).not.toBeInTheDocument();
  });
});
