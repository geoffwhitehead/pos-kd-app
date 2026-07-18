import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sampleKitchenDisplayResponse } from "../test/fixtures/kitchenDisplay";
import { TimelineRow } from "./TimelineRow";

describe("TimelineRow", () => {
  it("renders booking bars and a live till overlay on the same row", () => {
    render(
      <TimelineRow
        row={sampleKitchenDisplayResponse.tables[0]!}
        timeline={sampleKitchenDisplayResponse.timeline}
        onSelect={() => {}}
      />
    );

    expect(screen.getByText(/walker/i)).toBeInTheDocument();
    expect(screen.getByText(/food ordered/i)).toBeInTheDocument();
  });
});
