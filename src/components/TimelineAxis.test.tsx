import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TimelineAxis } from "./TimelineAxis";

describe("TimelineAxis", () => {
  it("renders the 12:00 to 22:00 service slots", () => {
    render(<TimelineAxis startHour={12} endHour={22} />);

    expect(screen.getByLabelText(/timeline axis/i)).toBeInTheDocument();
    expect(screen.getByText("12:00")).toBeInTheDocument();
    expect(screen.getByText("22:00")).toBeInTheDocument();
  });
});
