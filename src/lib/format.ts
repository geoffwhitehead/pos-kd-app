import { formatServiceClockTime, SERVICE_TIME_ZONE } from "./time";

export function formatServiceTime(value: string | null) {
  if (value == null) {
    return "No booking time";
  }

  return formatServiceClockTime(value);
}

export function formatShortTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: SERVICE_TIME_ZONE
  }).format(new Date(value));
}

export function formatKitchenItemTime(value: string | null) {
  if (value == null) {
    return "--:--";
  }

  return formatShortTime(value);
}

export function formatUpdatedAt(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: SERVICE_TIME_ZONE
  }).format(date);
}

export function formatStatusLabel(value: "active" | "food_ordered" | "called") {
  return value === "food_ordered"
    ? "Food Ordered"
    : value === "called"
      ? "Called"
      : "Active";
}
