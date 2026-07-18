export function formatServiceTime(value: string | null) {
  if (value == null) {
    return "No booking time";
  }

  const date = new Date(value);

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function formatShortTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function formatUpdatedAt(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}

export function formatStatusLabel(value: "active" | "food_ordered" | "called") {
  return value === "food_ordered"
    ? "Food Ordered"
    : value === "called"
      ? "Called"
      : "Active";
}
