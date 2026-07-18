import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SystemWarningBanner } from "./SystemWarningBanner";

describe("SystemWarningBanner", () => {
  it("renders warning copy and fetch errors", () => {
    render(
      <SystemWarningBanner
        error="Boom"
        warnings={[
          {
            code: "LIVE_ORDERS_UNAVAILABLE",
            message: "Live till order data is unavailable."
          }
        ]}
      />
    );

    expect(screen.getByText(/live refresh failed: boom/i)).toBeInTheDocument();
    expect(
      screen.getByText(/live till order data is unavailable/i)
    ).toBeInTheDocument();
  });
});

