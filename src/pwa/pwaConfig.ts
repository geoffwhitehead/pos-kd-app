import type { VitePWAOptions } from "vite-plugin-pwa";

export const pwaManifest = {
  name: "Nomi Kitchen Display",
  short_name: "Kitchen",
  start_url: "/",
  display: "fullscreen",
  background_color: "#e4e8e9",
  theme_color: "#ffffff",
  icons: [
    {
      src: "/icons/icon-192.png",
      sizes: "192x192",
      type: "image/png",
    },
    {
      src: "/icons/icon-512.png",
      sizes: "512x512",
      type: "image/png",
    },
  ],
} satisfies Exclude<VitePWAOptions["manifest"], false>;

export const pwaOptions = {
  registerType: "autoUpdate",
  injectRegister: false,
  includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
  manifest: pwaManifest,
  workbox: {
    skipWaiting: true,
    clientsClaim: true,
    globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
    navigateFallback: "/index.html",
    navigateFallbackDenylist: [/^\/api(?:\/|$)/],
    runtimeCaching: [],
  },
} satisfies Partial<VitePWAOptions>;
