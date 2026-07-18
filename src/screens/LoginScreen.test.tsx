import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoginScreen } from "./LoginScreen";

describe("LoginScreen", () => {
  it("renders email and password fields with a sign-in action", () => {
    render(
      <LoginScreen
        isLoading={false}
        error={null}
        onSubmit={async () => {}}
      />
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });
});
