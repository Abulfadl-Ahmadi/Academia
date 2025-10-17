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

createRoot(document.getElementById('root')!).render(<AppWrapper />)
