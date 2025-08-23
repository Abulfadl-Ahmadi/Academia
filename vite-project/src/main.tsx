import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '/src/assets/IranSansXPro/Webfonts/fontiran.css';
import '/src/assets/RaviPro/Ravi Family/Webfonts/fontiran.css';

// PDF Viewer styles are loaded via CDN in index.html
import { BrowserRouter } from "react-router-dom"
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
