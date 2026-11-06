// Keep telemetry to fixed route labels: never log paths, query strings, headers or bodies.
const bookingRoutes = new Set([
  "availability",
  "services",
  "attempts",
  "hold",
  "booking",
  "manage",
  "diary-events",
  "diary-versions",
  "timeline",
  "recent",
  "kitchen",
  "deposit-bookings",
  "audit",
  "reservations",
  "settings",
  "emails",
  "guests",
  "guest-access",
]);
const apiGroups = new Set([
  "auth",
  "security",
  "sync",
  "kd",
  "checks",
  "items",
  "sales",
  "payments",
  "orders",
  "operations",
  "employees",
  "rota",
  "reports",
  "xero",
  "public",
  "bookings",
]);
export function operationFor(request) {
  const path = new URL(request.url).pathname;
  const booking = path.match(
    /^\/v1\/(staff\/)?restaurants\/[a-z0-9-]{1,80}\/([a-z-]+)(?:\/|$)/,
  );
  if (booking && bookingRoutes.has(booking[2]))
    return `${booking[1] ? "staff" : "public"}.${booking[2]}`;
  const api = path.match(/^\/api\/([a-z-]+)(?:\/|$)/);
  if (api) return apiGroups.has(api[1]) ? `api.${api[1]}` : "api.other";
  if (path === "/health" || path === "/status") return "health";
  if (path === "/v1/staff/session") return "staff.session";
  return "other";
}
export function writeObservation(event) {
  try {
    console.log(
      JSON.stringify({
        source: "restaurant-observability",
        receivedAt: new Date().toISOString(),
        ...event,
      }),
    );
  } catch {
    /* Logging must not change application behavior. */
  }
}
export async function observeHttp(
  service,
  environment,
  request,
  handle,
  requestId = crypto.randomUUID(),
) {
  const started = performance.now();
  const operation = operationFor(request);
  let status = 500;
  try {
    const response = await handle();
    status = response.status;
    return response; // Preserve streaming bodies and WebSocket upgrades.
  } finally {
    const durationMs = Math.round(performance.now() - started);
    const repetitive =
      operation === "api.kd" ||
      operation === "staff.diary-versions" ||
      operation === "staff.kitchen" ||
      operation === "health";
    const sampleRate =
      status < 400 && durationMs < 1000 && repetitive ? 0.1 : 1;
    if (sampleRate === 1 || Math.random() < sampleRate)
      writeObservation({
        service,
        environment,
        event: "http_request",
        requestId,
        operation,
        method: [
          "GET",
          "POST",
          "PUT",
          "PATCH",
          "DELETE",
          "HEAD",
          "OPTIONS",
        ].includes(request.method)
          ? request.method
          : "other",
        status,
        durationMs,
        slow: durationMs >= 5000,
        sampleRate,
      });
  }
}
