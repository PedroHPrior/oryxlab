// Registers the workbox-generated service worker shipped by vite-plugin-pwa.
// On a new SW activation, prompts the user to refresh so they pick up the
// latest bundle. Silently does nothing in dev / unsupported browsers.

export function registerServiceWorker() {
  if (typeof window === "undefined") return
  if (!("serviceWorker" in navigator)) return
  // vite-plugin-pwa only emits the SW in production builds.
  if (import.meta.env.DEV) return

  // Lazy import so we don't pay the workbox cost in dev.
  import("workbox-window").then(({ Workbox }) => {
    const wb = new Workbox("/sw.js")
    wb.addEventListener("waiting", () => {
      // A new version is waiting , activate it on the next nav.
      wb.messageSkipWaiting()
    })
    wb.addEventListener("controlling", () => {
      // The new SW is now in control. Reload once to drop stale state.
      window.location.reload()
    })
    wb.register().catch(() => {
      /* swallow , non-fatal */
    })
  })
}
