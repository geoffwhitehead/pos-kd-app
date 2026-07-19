type Props = {
  rating: number | null;
  size?: number;
  color?: string;
};

export function StarRating({ rating, size = 14, color = "#f3c85b" }: Props) {
  const roundedRating = Math.max(0, Math.min(5, Math.round(rating ?? 0)));

  return (
    <span
      aria-label={`${roundedRating} star rating`}
      title={`${roundedRating} star rating`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "1px",
        color,
        fontSize: `${size}px`,
        lineHeight: 1,
        letterSpacing: "0.04em",
        textShadow: "0 0 10px rgba(243, 200, 91, 0.18)"
      }}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          style={{
            opacity: index < roundedRating ? 1 : 0.22
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}
