export function getApiBaseUrl() {
  const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (rawApiBaseUrl == null || rawApiBaseUrl.trim() === "") {
    // Production requests go through the same-origin Cloudflare API proxy.
    if (import.meta.env.PROD) return "";
    throw new Error("Missing VITE_API_BASE_URL");
  }

  return rawApiBaseUrl.trim().replace(/\/+$/, "");
}

export function buildApiUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
