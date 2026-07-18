import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

function Probe() {
  const { status } = useAuth();

  return <p>{status}</p>;
}

describe("AuthProvider", () => {
  it("boots into authenticated state when tokens exist in localStorage", () => {
    window.localStorage.setItem("kd.auth.accessToken", "access_123");
    window.localStorage.setItem("kd.auth.refreshToken", "refresh_456");

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    expect(screen.getByText("authenticated")).toBeInTheDocument();
  });
});
