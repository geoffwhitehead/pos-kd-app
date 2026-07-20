export const SERVICE_TIME_ZONE = "Europe/London";
export const SERVICE_HOURS_START = 10;
export const SERVICE_HOURS_END = 23;

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const zonedDateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: SERVICE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23"
});

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return Number(parts.find((part) => part.type === type)?.value ?? "0");
}

export function getZonedParts(value: string | Date): ZonedParts {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = zonedDateFormatter.formatToParts(date);

  return {
    year: getPart(parts, "year"),
    month: getPart(parts, "month"),
    day: getPart(parts, "day"),
    hour: getPart(parts, "hour"),
    minute: getPart(parts, "minute"),
    second: getPart(parts, "second")
  };
}

export function getServiceDateString(value: string | Date) {
  const parts = getZonedParts(value);

  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function getTimeZoneOffsetMs(date: Date) {
  const parts = getZonedParts(date);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);

  return asUtc - date.getTime();
}

export function localTimeOnServiceDateToIso(serviceDate: string, hour: number, minute = 0) {
  const [year, month, day] = serviceDate.split("-").map(Number);
  const provisionalUtcMs = Date.UTC(year, (month ?? 1) - 1, day ?? 1, hour, minute, 0, 0);
  const firstPass = provisionalUtcMs - getTimeZoneOffsetMs(new Date(provisionalUtcMs));
  const corrected = provisionalUtcMs - getTimeZoneOffsetMs(new Date(firstPass));

  return new Date(corrected).toISOString();
}

export function floorToHalfHourInServiceTimeZone(isoValue: string) {
  const parts = getZonedParts(isoValue);
  const flooredMinute = parts.minute < 30 ? 0 : 30;
  const serviceDate = getServiceDateString(isoValue);

  return localTimeOnServiceDateToIso(serviceDate, parts.hour, flooredMinute);
}

export function formatServiceClockTime(value: string | Date) {
  const parts = getZonedParts(value);

  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

export function getServiceHour(value: string | Date) {
  return getZonedParts(value).hour;
}

export function isWithinServiceHours(value: string | Date) {
  const hour = getServiceHour(value);

  return hour >= SERVICE_HOURS_START && hour < SERVICE_HOURS_END;
}
