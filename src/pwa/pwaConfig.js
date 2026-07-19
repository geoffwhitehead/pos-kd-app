export const pwaManifest = {
    name: "Nomi Kitchen Display",
    short_name: "Kitchen",
    start_url: "/",
    display: "fullscreen",
    background_color: "#101716",
    theme_color: "#101716",
    icons: [
        {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
        },
        {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
        }
    ]
};
export const pwaOptions = {
    registerType: "autoUpdate",
    injectRegister: false,
    includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
    manifest: pwaManifest,
    workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
        navigateFallback: "/index.html",
        runtimeCaching: []
    }
};
