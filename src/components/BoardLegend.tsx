export function BoardLegend() {
  const entries = [
    { label: "Booking / closed", fill: "var(--color-booking)" },
    { label: "Opened · no food", fill: "var(--color-seated)" },
    { label: "Food ordered", fill: "var(--color-food)" },
    { label: "Call", line: "var(--color-call)" },
    { label: "N · booked <4h ago", border: "var(--color-new-booking)" },
    { label: "W · possible walk-in", border: "var(--color-walk-in)" },
    { label: "Full-height red line · now", line: "var(--color-call)" },
  ];
  return (
    <footer
      aria-label="Planner legend"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "4px 12px",
        paddingTop: "7px",
        fontSize: "9px",
        lineHeight: 1.4,
        color: "var(--color-subtle)",
      }}
    >
      {entries.map((entry) => (
        <span
          key={entry.label}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            whiteSpace: "nowrap",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: entry.line ? "2px" : "12px",
              height: "9px",
              borderRadius: entry.line ? 0 : "2px",
              background: entry.fill ?? entry.line ?? "transparent",
              border: entry.border ? `1px solid ${entry.border}` : undefined,
            }}
          />
          {entry.label}
        </span>
      ))}
      <span title="Booking cells show covers; active cells show main-course quantities, not outstanding dishes.">
        Numbers: booking covers / active mains (walk-in cover estimate)
      </span>
      <span style={{ flexBasis: "100%" }}>
        Heatmap: numbers = booked covers · colours = arriving tables (grey 0,
        green 1–2, amber 3–4, red 5+). Starter pressure = arrivals 0–30 min
        earlier; main pressure = 30–60 min earlier; dessert pressure = 60–90 min
        earlier, weighted to 2/5 (40%) of tables and covers (≈ rounded covers).
        Estimates, not outstanding dishes.
      </span>
    </footer>
  );
}
