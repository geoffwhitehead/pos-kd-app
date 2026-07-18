import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TimelineAxis } from "./TimelineAxis";

describe("TimelineAxis", () => {
  it("renders hour labels with 30-minute subdivisions from 12:00 to 22:00", () => {
    render(<TimelineAxis startHour={12} endHour={22} />);

    expect(screen.getByLabelText(/timeline axis/i)).toBeInTheDocument();
    expect(screen.getByText("12:00")).toBeInTheDocument();
    expect(screen.getByText("12:30")).toBeInTheDocument();
    expect(screen.getByText("21:30")).toBeInTheDocument();
    expect(screen.getByText("22:00")).toBeInTheDocument();
  });
});
