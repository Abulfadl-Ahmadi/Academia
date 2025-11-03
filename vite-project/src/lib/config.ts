// Get API base URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Ensure trailing slash for API endpoints
export const getApiBaseUrl = (): string => {
  const url = API_BASE_URL.replace(/\/$/, ''); // Remove trailing slash if exists
  return url;
};

// Build full API URL for file access with token
export const getFileAccessUrl = (testId: number, token: string | null): string => {
  if (!token) {
    return '';
  }
  return `${getApiBaseUrl()}/tests/${testId}/file/pdf/?token=${token}`;
};

export default API_BASE_URL;
