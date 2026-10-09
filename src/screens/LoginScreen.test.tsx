import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoginScreen } from "./LoginScreen";

describe("LoginScreen", () => {
  it("requires a pairing code to connect the display", () => {
    render(
      <LoginScreen isLoading={false} error={null} onSubmit={async () => {}} />,
    );

    expect(screen.getByLabelText(/pairing code/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /connect display/i }),
    ).toBeDisabled();
  });
});
