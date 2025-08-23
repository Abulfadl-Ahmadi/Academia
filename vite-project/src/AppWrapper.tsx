import { StrictMode, useEffect } from 'react'
import { BrowserRouter } from "react-router-dom"
import App from './App'

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
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  );
}
