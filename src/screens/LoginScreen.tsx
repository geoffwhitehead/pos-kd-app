import { useState } from "react";
import styles from "./LoginScreen.module.css";

type Props = {
  isLoading: boolean;
  error: string | null;
  onSubmit: (params: { email: string; password: string }) => Promise<void>;
};

export function LoginScreen({ isLoading, error, onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className={styles.screen}>
      <section className={styles.card}>
        <h1>Kitchen Display</h1>
        <p>Sign in to open the live kitchen board.</p>
        <label className={styles.field}>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <p className={styles.error}>{error}</p> : null}
        <button
          type="button"
          className={styles.button}
          disabled={isLoading || email.trim() === "" || password.trim() === ""}
          onClick={() => onSubmit({ email: email.trim(), password })}
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </section>
    </main>
  );
}
