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
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-icons/pwa-icon.svg'],
      manifest: false, // Use the manifest.json from public directory
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // PDF.js is very heavy - separate it first
            if (id.includes('pdfjs-dist')) {
              return 'pdfjs';
            }
            // PDF viewer components (depend on React) - put with React
            if (id.includes('react-pdf') || id.includes('@react-pdf-viewer')) {
              return 'react-ecosystem';
            }
            // Charts library (heavy and depends on React) - put with React
            if (id.includes('recharts')) {
              return 'react-ecosystem';
            }
            // Icons that might depend on React - put with React
            if (id.includes('lucide-react') || id.includes('@radix-ui/react-icons')) {
              return 'react-ecosystem';
            }
            // Keep ALL React ecosystem together to avoid dependency issues
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') ||
                id.includes('@radix-ui') || id.includes('react-hook-form') || id.includes('@hookform')) {
              return 'react-ecosystem';
            }
            // Only pure utilities that definitely don't depend on React
            if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority') || 
                id.includes('axios')) {
              return 'utils';
            }
            // Put everything else with React to be safe
            return 'react-ecosystem';
          }
        }
      }
    },
    sourcemap: false,
    minify: 'esbuild', // Changed from terser to esbuild for faster builds
    chunkSizeWarningLimit: 1000,
    // Add font files to public assets to avoid processing issues
    assetsInlineLimit: 0, // Don't inline any assets
  },
    optimizeDeps: {
    include: ['react-pdf', 'pdfjs-dist'],
  },
})