import { StrictMode, useEffect } from 'react'
import { BrowserRouter, HashRouter } from "react-router-dom"
import App from './App'
import { DemoBadge } from './demo/DemoBadge'

const isDemo = import.meta.env.VITE_DEMO_MODE === 'true'
// A single-file demo is opened straight from disk, where there is no server to
// resolve /panel — so those builds route in the hash instead.
const Router = isDemo ? HashRouter : BrowserRouter

export const AppWrapper = () => {
  useEffect(() => {
    // Add offline detection
    const handleOffline = () => {
      document.body.classList.add('app-offline');
    }
    
    const handleOnline = () => {
      document.body.classList.remove('app-offline');
    }
    
    // Check initial status
    if (!navigator.onLine) {
      document.body.classList.add('app-offline');
    }
    
    // Add event listeners for online/offline status
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    // Cleanup
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    }
  }, []);
  
  return (
    <StrictMode>
      <Router>
        <App />
        {isDemo ? <DemoBadge /> : null}
      </Router>
    </StrictMode>
  );
}
