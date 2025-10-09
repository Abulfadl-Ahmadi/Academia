import { useEffect } from 'react';

const criticalImages = [
  '/Glass_shapes_optimized/1.webp',
  '/Glass_shapes_optimized/5.webp',
  '/Glass_shapes_optimized/17.webp',
  '/Glass_shapes_optimized/24.webp'
];

export function ImagePreloader() {
  useEffect(() => {
    // Preload critical images
    criticalImages.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.type = 'image/webp';
      document.head.appendChild(link);
    });

    // Cleanup
    return () => {
      const preloadLinks = document.querySelectorAll('link[rel="preload"][as="image"]');
      preloadLinks.forEach(link => {
        const htmlLink = link as HTMLLinkElement;
        if (criticalImages.includes(htmlLink.href.split(window.location.origin)[1])) {
          document.head.removeChild(htmlLink);
        }
      });
    };
  }, []);

  return null;
}