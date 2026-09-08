/**
 * Keeps plain anchors working in the single-file demo.
 *
 * Parts of the app link with raw `<a href="/panel/...">` rather than react-
 * router's `<Link>`. Served normally that is fine, but the demo build routes
 * in the hash and is opened from disk, where "/panel/..." resolves against the
 * filesystem root and lands nowhere. This turns those clicks into hash
 * navigation instead.
 *
 * Loaded only by demo builds, alongside install-demo-api.
 */
function isInternalPath(href: string | null): href is string {
  return !!href && href.startsWith("/") && !href.startsWith("//");
}

document.addEventListener(
  "click",
  (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const anchor = (event.target as Element | null)?.closest?.("a");
    if (!anchor) return;
    if (anchor.target && anchor.target !== "_self") return;
    if (anchor.hasAttribute("download")) return;

    const href = anchor.getAttribute("href");
    if (!isInternalPath(href)) return;

    event.preventDefault();
    window.location.hash = `#${href}`;
  },
  true // capture, so it runs before the app's own handlers
);
