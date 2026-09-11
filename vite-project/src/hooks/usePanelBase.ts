import { useLocation } from "react-router-dom";

/**
 * A handful of dashboard screens are reused by public marketing sections whose
 * routes mirror the panel's path-for-path under a different prefix (e.g.
 * `/panel/test-collections` <-> `/exams/test-collections`). Those screens must
 * link within whichever tree is currently mounted, so build links from this
 * base instead of hardcoding `/panel`.
 */
const MIRRORED_SECTION_BASES = ["/exams", "/classes"] as const;

export function usePanelBase(): "/panel" | (typeof MIRRORED_SECTION_BASES)[number] {
  const { pathname } = useLocation();
  const match = MIRRORED_SECTION_BASES.find(
    (base) => pathname === base || pathname.startsWith(`${base}/`)
  );
  return match ?? "/panel";
}
