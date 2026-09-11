import { useLocation } from "react-router-dom";

/**
 * The AI chat screens are mounted twice: inside the student panel and inside
 * the public "/ai" section reached from the site header. Same as
 * `usePanelBase`, links have to stay inside whichever tree is mounted, so build
 * them from this base instead of hardcoding the panel path.
 */
export function useAiChatBase(): "/panel/support/ask-ai" | "/ai/chat" {
  const { pathname } = useLocation();
  const inPublicSection = pathname === "/ai" || pathname.startsWith("/ai/");
  return inPublicSection ? "/ai/chat" : "/panel/support/ask-ai";
}
