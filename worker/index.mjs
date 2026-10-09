const routes = new Set([
  "GET /api/kd/board",
  "POST /api/security/pair",
  "PUT /api/auth/refresh-tokens",
]);

function failure(status, message) {
  return Response.json(
    { success: false, message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function proxyApi(request, env, upstreamFetch = fetch) {
  const url = new URL(request.url);
  if (!routes.has(`${request.method} ${url.pathname}`))
    return failure(404, "Not found.");
  if (
    request.headers.get("X-Kitchen-Request") !== "1" ||
    (request.headers.has("Origin") &&
      request.headers.get("Origin") !== url.origin) ||
    (request.headers.has("Sec-Fetch-Site") &&
      request.headers.get("Sec-Fetch-Site") !== "same-origin")
  )
    return failure(403, "Request not permitted.");

  const target = new URL(env.POS_API_ORIGIN);
  if (
    target.protocol !== "https:" ||
    target.username ||
    target.password ||
    target.pathname !== "/" ||
    target.search ||
    target.hash
  ) {
    throw new Error("Invalid API origin");
  }
  target.pathname = url.pathname;
  const headers = new Headers({ Accept: "application/json" });
  for (const name of [
    "Authorization",
    "X-Refresh-Token",
    "X-Refresh-Request-Id",
    "Content-Type",
  ]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  let body;
  if (url.pathname === "/api/security/pair") {
    let payload;
    try {
      payload = await request.json();
    } catch {
      return failure(400, "Invalid pairing request.");
    }
    if (typeof payload?.code !== "string" || payload.code.length > 32)
      return failure(400, "Invalid pairing code.");
    body = JSON.stringify({
      code: payload.code,
      expectedOrganizationId: env.ORGANIZATION_ID,
    });
    headers.set("Content-Type", "application/json");
  }
  const upstream = await upstreamFetch(target, {
    method: request.method,
    headers,
    body,
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
  });
  if (upstream.status >= 300 && upstream.status < 400)
    return failure(502, "Unexpected API redirect.");
  const responseHeaders = new Headers({
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  for (const name of ["Authorization", "X-Refresh-Token", "Retry-After"]) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export default {
  async fetch(request, env) {
    const pathname = new URL(request.url).pathname;
    if (pathname === "/api" || pathname.startsWith("/api/")) {
      try {
        return await proxyApi(request, env);
      } catch {
        return failure(502, "Kitchen data unavailable. Retrying shortly.");
      }
    }
    return env.ASSETS.fetch(request);
  },
};
