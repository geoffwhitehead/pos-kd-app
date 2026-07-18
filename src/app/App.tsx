import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { LoginScreen } from "../screens/LoginScreen";
import { KitchenDisplayScreen } from "../screens/KitchenDisplayScreen";
import { useKitchenDisplayPolling } from "../hooks/useKitchenDisplayPolling";

export function App() {
  const { session, signIn, signOut, status, updateSession } = useAuth();
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { data, error, isLoading } = useKitchenDisplayPolling(session, {
    onAuthFailure: signOut,
    onSessionRefresh: updateSession
  });

  if (status !== "authenticated" || session == null) {
    return (
      <LoginScreen
        isLoading={isSigningIn}
        error={signInError}
        onSubmit={async (params) => {
          setIsSigningIn(true);
          try {
            await signIn(params);
            setSignInError(null);
          } catch (caught) {
            setSignInError(
              caught instanceof Error ? caught.message : "Sign in failed"
            );
          } finally {
            setIsSigningIn(false);
          }
        }}
      />
    );
  }

  return (
    <KitchenDisplayScreen data={data} error={error} isLoading={isLoading} />
  );
}
