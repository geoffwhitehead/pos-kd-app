import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";
import { ServiceBoard } from "./ServiceBoard";

describe("ServiceBoard", () => {
  it("renders grouped timeline rows as tappable overlays", () => {
    const onSelect = vi.fn();

    render(
      <ServiceBoard
        rows={sampleKitchenDisplayResponse.tables}
        timeline={sampleKitchenDisplayResponse.timeline}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /live order 12/i }));

    expect(onSelect).toHaveBeenCalledWith("12");
    expect(screen.getByText(/ground floor/i)).toBeInTheDocument();
  });
});
