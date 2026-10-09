import { describe, expect, it, vi } from "vitest";
import { proxyApi } from "./index.mjs";
const env = {
  POS_API_ORIGIN: "https://api.example.com",
  ORGANIZATION_ID: "restaurant",
};
function request(path, options = {}) {
  return new Request(`https://kitchen.example.com${path}`, {
    ...options,
    headers: { "X-Kitchen-Request": "1", ...options.headers },
  });
}

describe("kitchen API proxy", () => {
  it("forwards board credentials without cookies or tenant headers and disables caching", async () => {
    const upstream = vi
      .fn()
      .mockResolvedValue(Response.json({ boardRows: [] }));
    const response = await proxyApi(
      request("/api/kd/board", {
        headers: {
          Authorization: "Bearer test",
          Cookie: "staff=secret",
          "X-Organization-Id": "other",
        },
      }),
      env,
      upstream,
    );
    const [url, options] = upstream.mock.calls[0];
    expect(url.href).toBe("https://api.example.com/api/kd/board");
    expect(options.headers.get("authorization")).toBe("Bearer test");
    expect(options.headers.has("cookie")).toBe(false);
    expect(options.headers.has("x-organization-id")).toBe(false);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("pins pairing to the configured restaurant", async () => {
    const upstream = vi
      .fn()
      .mockResolvedValue(Response.json({ accessToken: "test" }));
    await proxyApi(
      request("/api/security/pair", {
        method: "POST",
        body: JSON.stringify({
          code: "12345678",
          expectedOrganizationId: "other",
        }),
      }),
      env,
      upstream,
    );
    expect(JSON.parse(upstream.mock.calls[0][1].body)).toEqual({
      code: "12345678",
      expectedOrganizationId: "restaurant",
    });
  });
  it("blocks other APIs and cross-origin requests", async () => {
    const upstream = vi.fn();
    expect((await proxyApi(request("/api/sync"), env, upstream)).status).toBe(
      404,
    );
    expect(
      (
        await proxyApi(
          request("/api/kd/board", {
            headers: { Origin: "https://other.example" },
          }),
          env,
          upstream,
        )
      ).status,
    ).toBe(403);
    expect(upstream).not.toHaveBeenCalled();
  });
  it("does not follow API redirects with credentials", async () => {
    const upstream = vi
      .fn()
      .mockResolvedValue(
        new Response(null, {
          status: 302,
          headers: { Location: "https://other.example" },
        }),
      );
    expect(
      (await proxyApi(request("/api/kd/board"), env, upstream)).status,
    ).toBe(502);
    expect(upstream.mock.calls[0][1].redirect).toBe("manual");
  });
});
