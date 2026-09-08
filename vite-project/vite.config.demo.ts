/**
 * Build config for the offline demo: one self-contained HTML file that opens
 * from disk with no server and no backend behind it.
 *
 *   npm run build:demo   ->  dist-demo/index.html
 *
 * Differences from the normal build (vite.config.ts):
 *  - VITE_DEMO_MODE swaps in the recorded API adapter and hash routing
 *    (see src/demo/install-demo-api.ts and src/AppWrapper.tsx)
 *  - no code splitting and no PWA service worker, since both need real URLs
 *  - every asset is inlined, so the result is a single file to send on
 */
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  base: "./",
  define: {
    "import.meta.env.VITE_DEMO_MODE": JSON.stringify("true"),
  },
  plugins: [react(), tailwindcss(), viteSingleFile({ removeViteModuleLoader: true })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Supplied by vite-plugin-pwa, which this build deliberately omits.
      "virtual:pwa-register": path.resolve(__dirname, "./src/demo/pwa-register-stub.ts"),
    },
  },
  build: {
    outDir: "dist-demo",
    emptyOutDir: true,
    // No separate asset files can survive alongside a single HTML, so inline
    // everything regardless of size.
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 20000,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
