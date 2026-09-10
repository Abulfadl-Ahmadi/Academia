/**
 * Version and build metadata module
 */

export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.2.0';
export const GIT_COMMIT = typeof __GIT_COMMIT__ !== 'undefined' ? __GIT_COMMIT__ : '';
export const GIT_TAG = typeof __GIT_TAG__ !== 'undefined' ? __GIT_TAG__ : '';
export const BUILD_DATE = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '';

/**
 * Returns a concise version string for UI display, e.g. "v1.2.0 (Build-11)"
 */
export const getDisplayVersion = (): string => {
  const parts = [`v${APP_VERSION}`];
  if (GIT_TAG && GIT_TAG !== `v${APP_VERSION}`) {
    parts.push(`(${GIT_TAG})`);
  } else if (GIT_COMMIT && GIT_COMMIT !== 'dev') {
    parts.push(`(${GIT_COMMIT})`);
  }
  return parts.join(' ');
};

/**
 * Returns detailed diagnostic information about client application and browser environment
 */
export const getClientDiagnosticInfo = (): string => {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  const platform = typeof navigator !== 'undefined' ? (navigator.platform || 'Unknown') : 'Unknown';
  const screenSize = typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Unknown';
  
  return [
    `نسخه فرانت‌اند: ${getDisplayVersion()}`,
    `شماره ساخت: ${GIT_TAG || 'نامشخص'}`,
    `هش کامیت: ${GIT_COMMIT || 'نامشخص'}`,
    `تاریخ ساخت: ${BUILD_DATE || 'نامشخص'}`,
    `پلتفرم: ${platform}`,
    `رزولوشن صفحه: ${screenSize}`,
    `اطلاعات مرورگر: ${userAgent}`
  ].join('\n');
};

/**
 * Copy diagnostic info to clipboard
 */
export const copyDiagnosticInfoToClipboard = async (): Promise<boolean> => {
  try {
    const text = getClientDiagnosticInfo();
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to copy diagnostic info:', error);
    return false;
  }
};
