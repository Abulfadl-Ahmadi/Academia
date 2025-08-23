import { registerSW } from 'virtual:pwa-register'

// This is the service worker registration function provided by vite-plugin-pwa
const updateSW = registerSW({
  // Called when a new service worker is available
  onNeedRefresh() {
    // Show a message to the user
    if (confirm('آپدیت جدیدی در دسترس است. آیا می‌خواهید صفحه را بارگذاری مجدد کنید؟')) {
      updateSW(true)
    }
  },
  // Called when a new service worker has been registered but does not control the page
  onOfflineReady() {
    console.log('Application is ready for offline usage')
    // Show a notification to the user that the app is ready for offline use
    const offlineReadyNotification = document.createElement('div')
    offlineReadyNotification.className = 'offline-ready-notification'
    offlineReadyNotification.textContent = 'اپلیکیشن برای استفاده آفلاین آماده است.'
    
    document.body.appendChild(offlineReadyNotification)
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      offlineReadyNotification.remove()
    }, 3000)
  }
})

export { updateSW }
