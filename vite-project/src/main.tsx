import { createRoot } from 'react-dom/client'
import './index.css'
import '/src/assets/IranSansXPro/Webfonts/fontiran.css';
import '/src/assets/RaviPro/Ravi Family/Webfonts/fontiran.css';
import './pwa.css' // Import PWA styles

// Import service worker registration
import './pwa'

// Import the AppWrapper component
import { AppWrapper } from './AppWrapper'

createRoot(document.getElementById('root')!).render(<AppWrapper />)
