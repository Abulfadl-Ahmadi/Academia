import { createRoot } from 'react-dom/client'
import './index.css'
// KaTeX base styles for math rendering (ensure katex is installed in node_modules)
import 'katex/dist/katex.min.css'
// import '/src/assets/IranSansXPro/Webfonts/fontiran.css';
// import '/src/assets/RaviPro/RaviFamily/Webfonts/fontiran.css';
import './pwa.css' // Import PWA styles

// Import service worker registration
import './pwa'

// Import the AppWrapper component
import './styles/katex-overrides.css'
import { AppWrapper } from './AppWrapper'

async function boot() {
  // Demo builds replay a recorded API instead of calling Django, so the
  // adapter has to be swapped in before the first component mounts and
  // fetches. Dynamic so the snapshot never lands in the normal bundle.
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    await import('./demo/install-demo-api')
    await import('./demo/install-demo-links')
  }

  createRoot(document.getElementById('root')!).render(<AppWrapper />)
}

boot()
