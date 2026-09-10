/**
 * Stands in for `virtual:pwa-register` in the demo build, which runs without
 * the PWA plugin: a single file opened from disk has no service worker to
 * register, and no new version to notify anyone about.
 */
export function registerSW(_options?: unknown) {
  return async (_reloadPage?: boolean) => {};
}
