export function getApiBaseUrl() {
  const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (rawApiBaseUrl == null || rawApiBaseUrl.trim() === "") {
    throw new Error("Missing VITE_API_BASE_URL");
  }

  return rawApiBaseUrl.replace(/\/+$/, "");
}

export function buildApiUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
