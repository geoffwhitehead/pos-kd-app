import { useState } from "react";
import styles from "./LoginScreen.module.css";

type Props = {
  isLoading: boolean;
  error: string | null;
  onSubmit: (params: { code: string }) => Promise<void>;
};

export function LoginScreen({ isLoading, error, onSubmit }: Props) {
  const [code, setCode] = useState("");

  return (
    <main className={styles.screen}>
      <section className={styles.card}>
        <h1>Kitchen Display</h1>
        <p>
          Generate a device pairing code in backoffice to connect this display.
          It will stay connected until you revoke it.
        </p>
        <label className={styles.field}>
          <span>Pairing code</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={9}
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/[^0-9]/g, "").slice(0, 8))
            }
          />
        </label>
        {error ? <p className={styles.error}>{error}</p> : null}
        <button
          type="button"
          className={styles.button}
          disabled={isLoading || code.length !== 8}
          onClick={() => onSubmit({ code })}
        >
          {isLoading ? "Connecting..." : "Connect display"}
        </button>
      </section>
    </main>
  );
}
