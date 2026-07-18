import { formatShortTime } from "../lib/format";
import type { TableCall } from "../types/kitchenDisplay";

export type FooterBillCall = TableCall & {
  dismissalKey: string;
};

type Props = {
  calls: FooterBillCall[];
  dismissedCallIds: string[];
  onDismiss: (dismissalKey: string) => void;
};

export function BillCallFooter({ calls, dismissedCallIds, onDismiss }: Props) {
  const visibleCalls = calls.filter(
    (call) =>
      call != null && call.id != null && !dismissedCallIds.includes(call.dismissalKey)
  );

  return (
    <section aria-label="Bill calls" style={{ marginTop: "14px" }}>
      <div
        style={{
          padding: "12px 14px",
          border: "1px solid var(--color-border)",
          borderRadius: "18px",
          background: "linear-gradient(180deg, rgba(36, 46, 46, 0.95), rgba(23, 30, 30, 0.95))",
          boxShadow: "var(--shadow-panel)",
          display: "grid",
          gap: "10px"
        }}
      >
        <div
          style={{
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--color-subtle)"
          }}
        >
          Bill Calls
        </div>
        <div
          style={{
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: "minmax(120px, max-content)",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "2px"
          }}
        >
          {visibleCalls.length > 0 ? (
            visibleCalls.map((call) => (
              <article
                key={call.id}
                style={{
                  position: "relative",
                  minHeight: "72px",
                  padding: "10px 30px 10px 10px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(17, 24, 24, 0.78)",
                  color: "var(--color-text)",
                  display: "grid",
                  gap: "4px",
                  alignContent: "start"
                }}
              >
                <button
                  type="button"
                  aria-label={`Dismiss call ${call.dismissalKey}`}
                  onClick={() => onDismiss(call.dismissalKey)}
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    width: "18px",
                    height: "18px",
                    border: 0,
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.08)",
                    color: "var(--color-text)",
                    fontSize: "11px",
                    cursor: "pointer"
                  }}
                >
                  x
                </button>
                <strong style={{ fontSize: "18px", lineHeight: 1 }}>Table {call.displayRef}</strong>
                <span style={{ fontSize: "13px", color: "var(--color-subtle)" }}>
                  {formatShortTime(call.calledAt)}
                </span>
              </article>
            ))
          ) : (
            <div
              style={{
                minHeight: "72px",
                borderRadius: "12px",
                border: "1px dashed rgba(255,255,255,0.08)",
                color: "var(--color-subtle)",
                display: "grid",
                placeItems: "center",
                padding: "10px 12px",
                fontSize: "13px"
              }}
            >
              No bill calls.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
