export declare const pwaManifest: {
    name: string;
    short_name: string;
    start_url: string;
    display: "fullscreen";
    background_color: string;
    theme_color: string;
    icons: {
        src: string;
        sizes: string;
        type: string;
    }[];
};
export declare const pwaOptions: {
    registerType: "autoUpdate";
    injectRegister: false;
    includeAssets: string[];
    manifest: {
        name: string;
        short_name: string;
        start_url: string;
        display: "fullscreen";
        background_color: string;
        theme_color: string;
        icons: {
            src: string;
            sizes: string;
            type: string;
        }[];
    };
    workbox: {
        globPatterns: string[];
        navigateFallback: string;
        runtimeCaching: any[];
    };
};
