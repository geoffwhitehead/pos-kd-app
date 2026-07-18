import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import { signInRequest } from "../api/auth";
import {
  clearStoredAuthSession,
  loadStoredAuthSession,
  saveStoredAuthSession
} from "../lib/authStorage";
import type { AuthSession, SignInParams } from "../types/auth";

type AuthStatus = "unauthenticated" | "authenticated";

type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession | null;
  signIn: (params: SignInParams) => Promise<void>;
  signOut: () => void;
  updateSession: (session: AuthSession) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const initialSession = loadStoredAuthSession();
  const [session, setSession] = useState<AuthSession | null>(initialSession);
  const status: AuthStatus =
    session == null ? "unauthenticated" : "authenticated";

  async function signIn(params: SignInParams) {
    const nextSession = await signInRequest(params);
    saveStoredAuthSession(nextSession);
    setSession(nextSession);
  }

  function signOut() {
    clearStoredAuthSession();
    setSession(null);
  }

  function updateSession(nextSession: AuthSession) {
    saveStoredAuthSession(nextSession);
    setSession(nextSession);
  }

  const value = useMemo(
    () => ({
      status,
      session,
      signIn,
      signOut,
      updateSession
    }),
    [session, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (value == null) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return value;
}
