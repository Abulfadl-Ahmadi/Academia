import { registerSW } from 'virtual:pwa-register'
import { toast } from 'sonner'

type UpdateListener = (hasUpdate: boolean) => void;
const listeners = new Set<UpdateListener>();
let hasUpdateState = false;

export const getHasUpdate = () => hasUpdateState;

export const subscribeToUpdate = (listener: UpdateListener) => {
  listeners.add(listener);
  listener(hasUpdateState);
  return () => {
    listeners.delete(listener);
  };
};

const setHasUpdate = (value: boolean) => {
  hasUpdateState = value;
  listeners.forEach((listener) => listener(value));
};

// This is the service worker registration function provided by vite-plugin-pwa
const updateSW = registerSW({
  // Called when a new service worker is available
  onNeedRefresh() {
    setHasUpdate(true);
    toast('نسخه جدید سایت در دسترس است', {
      description: 'برای مشاهده آخرین تغییرات لطفاً سایت را به‌روزرسانی کنید.',
      duration: 100000, // Stay on screen for a long time
      action: {
        label: 'به‌روزرسانی',
        onClick: () => {
          updateSW(true)
        }
      }
    })
  },
  // Called when a new service worker has been registered but does not control the page
  onOfflineReady() {
    console.log('Application is ready for offline usage')
  }
})

export const applyAppUpdate = () => {
  updateSW(true);
};

export { updateSW }

