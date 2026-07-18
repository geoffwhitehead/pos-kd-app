import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../context/AuthContext";
import { App } from "./App";

vi.mock("../hooks/useKitchenDisplayPolling", () => ({
  useKitchenDisplayPolling: () => ({
    data: null,
    error: null,
    isLoading: false
  })
}));

describe("App", () => {
  it("shows login when no session is stored", () => {
    window.localStorage.clear();

    render(
      <AuthProvider>
        <App />
      </AuthProvider>
    );

    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });
});
