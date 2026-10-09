export async function registerPwa() {
  if (!import.meta.env.PROD) {
    return;
  }

  if (!("serviceWorker" in navigator)) {
    return;
  }

  const workers = navigator.serviceWorker;
  const hadController = workers.controller != null;
  let reloading = false;
  workers.addEventListener("controllerchange", () => {
    // Initial installation does not need a reload; replacing an old app does.
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });

  async function register() {
    try {
      const registration = await workers.register("/sw.js", {
        updateViaCache: "none",
      });
      const update = () => {
        void registration.update().catch(() => {});
      };
      update();
      window.setInterval(update, 60000);
      window.addEventListener("online", update);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") update();
      });
    } catch {
      // An offline display can continue running without registering an update.
    }
  }
  if (document.readyState === "complete") await register();
  else
    window.addEventListener(
      "load",
      () => {
        void register();
      },
      { once: true },
    );
}
