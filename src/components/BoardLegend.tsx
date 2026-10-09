export function BoardLegend() {
  const entries = [
    { label: "Booking / closed", fill: "#555b63" },
    { label: "Opened · no food", fill: "#32764c" },
    { label: "Food ordered", fill: "#97631e" },
    { label: "Call", line: "#d84a3f" },
    { label: "N · booked <4h ago", border: "#69d391" },
    { label: "W · possible walk-in", border: "#80c9ef" },
    { label: "Full-height red line · now", line: "#ea463a" },
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
        Numbers: booking covers / active mains
      </span>
      <span style={{ flexBasis: "100%" }}>
        Heatmap: numbers = booked covers · colours = arriving tables (grey 0,
        green 1–2, amber 3–4, red 5+). Starter pressure = arrivals 0–30 min
        earlier; main pressure = 30–60 min earlier. Estimates, not outstanding
        dishes.
      </span>
    </footer>
  );
}
