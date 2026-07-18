import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { AuthProvider } from "../context/AuthContext";

export function renderWithApp(ui: ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}
