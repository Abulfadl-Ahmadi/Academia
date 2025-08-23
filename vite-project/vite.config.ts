import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    // host: "172.25.82.128",
    port: 5173,
    host: true,
    allowedHosts: ['*'],
  },
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icons/pwa-icon.svg'],
      manifest: false, // Use the manifest.json from public directory
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 4000000 // 4MB
      }
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
   build: {
    rollupOptions: {
      output: {
        manualChunks: undefined, // Optional: prevents React-PDF splitting
      }
    },
  },
    optimizeDeps: {
    include: ['react-pdf', 'pdfjs-dist'],
  },
})