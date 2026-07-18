import type { DisplayWarning } from "../types/kitchenDisplay";

type Props = {
  warnings: DisplayWarning[];
  error: string | null;
};

export function SystemWarningBanner({ warnings, error }: Props) {
  if (warnings.length === 0 && error == null) {
    return null;
  }

  return (
    <section aria-label="System warnings">
      {error ? <p>Live refresh failed: {error}</p> : null}
      {warnings.map((warning) => (
        <p key={`${warning.code}-${warning.message}`}>{warning.message}</p>
      ))}
    </section>
  );
}

