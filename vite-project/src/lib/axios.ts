// src/lib/axios.ts
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create the instance
const axiosInstance = axios.create({
  baseURL: baseURL + "/",
  withCredentials: true, // Send cookies with requests
});

// Log the base URL once for debugging
console.log('Axios base URL:', baseURL);

// Fix API path issue by removing duplicate 'api' prefix if it already exists
axiosInstance.interceptors.request.use(config => {
  // If the URL already starts with /api/ and the baseURL includes /api/,
  // we need to avoid duplicate 'api' segments
  if (config.url?.startsWith('/api/') && baseURL?.includes('/api')) {
    config.url = config.url.replace(/^\/api/, '');
  }
  return config;
});

// Login state stored in memory (optional)
let loginStatus = false;

export function markLoggedIn() {
  loginStatus = true;
}

export function markLoggedOut() {
  loginStatus = false;
}

export function isLogin() {
  return loginStatus;
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      loginStatus &&
      !originalRequest.url.includes("/token/refresh/")
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the access token via cookie
        await axiosInstance.post("/token/refresh/", {}, {
          withCredentials: true,
        });

        // Broadcast token update to other tabs
        if (typeof BroadcastChannel !== 'undefined') {
          const channel = new BroadcastChannel('auth_channel');
          channel.postMessage({
            type: 'TOKEN_UPDATED',
            timestamp: Date.now()
          });
          channel.close();
        }
        
        // Also use localStorage event
        localStorage.setItem('auth_token_updated', Date.now().toString());
        localStorage.removeItem('auth_token_updated');

        return axiosInstance(originalRequest); // Retry original request
      } catch (err) {
        markLoggedOut();
        localStorage.removeItem("access_token"); // In case it's still used somewhere
        
        // Broadcast logout to other tabs
        if (typeof BroadcastChannel !== 'undefined') {
          const channel = new BroadcastChannel('auth_channel');
          channel.postMessage({
            type: 'TOKEN_EXPIRED',
            timestamp: Date.now()
          });
          channel.close();
        }
        
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
